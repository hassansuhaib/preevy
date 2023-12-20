import { BlobServiceClient, ContainerClient, BlobDeleteOptions, BlobDeleteIfExistsResponse } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'
import { VirtualFS } from '@preevy/core'

export const defaultBucketName = (
  { profileAlias, accountId }: { profileAlias: string; accountId: string },
) => `preevy-${accountId}-${profileAlias}`

const ensureContainerExists = async (blobServiceClient: BlobServiceClient, containerName: string) => {
  const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName)
  const exists = await containerClient.createIfNotExists()

  if (!exists) {
    await containerClient.create()
  }
}

export const parseAzureBlobUrl = (azureBlobUrl: string) => {
  const url = new URL(azureBlobUrl)

  if (!(url.protocol === 'az:')) {
    throw new Error('Azure Blob urls must start with az:')
  }

  const accountName = url.hostname.split('.')[0]

  const pathSegments = url.pathname.split('/')
  const containerName = pathSegments[1]

  return {
    url,
    accountName,
    containerName,
  }
}

async function streamToBuffer(readableStream: NodeJS.ReadableStream) {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    readableStream.on('data', data => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
    })
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    readableStream.on('error', reject)
  })
}

export const azureStorageBlobFs = async (azureBlobUrl: string): Promise<VirtualFS> => {
  const { accountName, containerName } = parseAzureBlobUrl(azureBlobUrl)

  const defaultAzureCredential = new DefaultAzureCredential()

  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    defaultAzureCredential
  )
  const containerClient = blobServiceClient.getContainerClient(containerName)

  await ensureContainerExists(blobServiceClient, containerName)

  return {
    read: async (filename: string) => {
      const blobClient = containerClient.getBlobClient(filename)
      const result = await blobClient.download()
      if (result.readableStreamBody !== undefined) {
        return await streamToBuffer(result.readableStreamBody)
      }
      return undefined
    },
    write: async (filename: string, content: Buffer | string) => {
      const blockBlobClient = containerClient.getBlockBlobClient(filename)
      await blockBlobClient.upload(content, content.length)
    },
    delete: async (filename: string) => {
      const blockBlobClient = containerClient.getBlockBlobClient(filename)
      const options: BlobDeleteOptions = {
        deleteSnapshots: 'include',
      }
      const blobDeleteIfExistsResponse: BlobDeleteIfExistsResponse = await blockBlobClient.deleteIfExists(options)

      if (blobDeleteIfExistsResponse.errorCode) {
        throw new Error(`Error: ${blobDeleteIfExistsResponse.errorCode}`)
      }
    },
  }
}
