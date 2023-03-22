<h1 align="center">
  <a href="https://preevy.dev" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="site/static/img/logo-dark.svg">
      <img width="80" src="site/static/img/logo-light.svg">
    </picture>
  </a>
  <br />
    <br />
  Preevy
</h1>
<p align="center"> <em>Provision preview environments with minimal configuration</em>
</p>
<br />
<div align="center">

![GitHub](https://img.shields.io/github/license/livecycle/preevy) ![GitHub last commit](https://img.shields.io/github/last-commit/livecycle/preevy) [![Version](https://img.shields.io/npm/v/preevy.svg)](https://npmjs.org/package/preevy)

</div>

<br />

![Terminal GIF](./terminal.gif)

`preevy` is a powerful CLI tool designed to simplify the process of creating ephemeral preview environments.
Using `preevy`, you can easily provision any Docker-Compose application on AWS using affordable [Lightsail](https://aws.amazon.com/free/compute/lightsail) VMs (support for GCP and more cloud is on the way).

## Why?

At Livecycle, we believe that preview environments are an integral part of any development flow, in any engineering team.
These non-production, ephemeral environments, created for every Pull Request, can significantly improve PR workflows.
In recent years, preview environments have become increasingly popular, with some PaaS providers even offering deeply integrated preview environments.
However, setting up preview environments can be a complex and costly task, which is why many teams have been hesitant to implement them.
`preevy` is designed to simplify this task and provide a framework for provisioning and utilizing preview environments to optimize the PR flow.
You can read more about the story and philosophy behind Preview here.

## Getting started

To start using the `preevy` CLI you will need:

- A local AWS configuration (you can get it by using `aws login` or `aws configure`)
- A Docker-Compose application (examples can be found [here](https://github.com/docker/awesome-compose))

Running `preevy`:

1. Install the CLI using npm:`npm install -g preevy` , or use it directly using: `npx preevy <command>`
2. Set up a profile by using: `preevy init`
3. Use `up` command to provision a new VM (Lightsail) with your application: `preevy up`
4. Access and share your new preview environment by using the `*.livecycle.run` outputted by the CLI.
5. Destroy the environment by using: `preevy down`.

## Under the hood

`preevy` tool is has two main components:

#### CLI (packages/cli)

The CLI is a node.js program responsible for:

- Provisioning and tearing down VMs.
- Exposing environments' state and URLs to the end user.
- Storing & accessing profile data. (settings, keys, etc...)
- Setting up a VM with Docker tooling.
- Syncing Compose source code and local volumes.
- Running the application and installing daemon for connecting to the tunneling service.

#### Tunnel server (packages/tunnel-server)

The tunnel server is a node.js base server responsible for exposing friendly HTTPS URLs for the Compose services.
A free public instance is hosted on `livecycle.run`, and it can be self-hosted as well.

A Docker/OCI image is available on ghcr.io: ghcr.io/livecycle/preview/tunnel-server

## CI Integration

`preevy` is also designed to work seamlessly with your CI, allowing you to easily import a shared preview profile shared in S3 (support for more storage providers is coming soon).

The profile can be created using `preevy init`, then choosing S3 URL for storing the profile. (Preevy will create a bucket if one doesn't exist)
After the profile is created, it can be imported in the CI using `preevy init --from <s3-url>`

[Examples]

## Security

In case you find a security issue or have something you would like to discuss refer to our security.md policy.

#### Notice on preview environments exposure

VMs are not exposed directly and instead are exposed via a tunnel created by the tunneling server.
Every Compose service is exposed individually with a generated URL in the following format:
`https://{service}-{[port]}-{envId}-{clientId}.{tunnel-server domain}`

- EnvId can be specified by the `up` command `id` flag, or automatically generated by git context.
- ClientId is a unique identifier based on the profile's public tunneling SSH key (generated in `init`).
  When using the `*.livecycle.run`, all environments are publicly accessible to those who know of the URLs.

## Contributing

Found a bug? Have a missing feature? Please open an issue and let us know.
