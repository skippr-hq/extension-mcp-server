# Changelog

# [0.6.0](https://github.com/skippr-hq/extension-mcp-server/compare/v0.5.1...v0.6.0) (2025-10-24)


### Features

* Rename xray to extension-mcp-server ([a957deb](https://github.com/skippr-hq/extension-mcp-server/commit/a957deb7df4db10798c83e0d15108dba5174d114))

## [0.5.1](https://github.com/skippr-hq/mcp-x-ray/compare/v0.5.0...v0.5.1) (2025-10-23)


### Bug Fixes

* Added a heartbeat handler in websocket server ([c3f7659](https://github.com/skippr-hq/mcp-x-ray/commit/c3f76597f4a2fd4526a3e2a99242c4a0b82aaaac))

# [0.5.0](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.7...v0.5.0) (2025-10-22)


### Features

* include reasoning in output of validate fix tool ([d074af3](https://github.com/skippr-hq/mcp-x-ray/commit/d074af318bcb782d96e93c44be7d28c68766f183))

## [0.4.7](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.6...v0.4.7) (2025-10-21)


### Bug Fixes

* use object format for bin configuration to resolve npx execution ([d6dc45d](https://github.com/skippr-hq/mcp-x-ray/commit/d6dc45d4736f92592b29a8c9d79e200c7e821536))

## [0.4.6](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.5...v0.4.6) (2025-10-21)


### Bug Fixes

* improve package bin configuration and add startup logging ([f141f62](https://github.com/skippr-hq/mcp-x-ray/commit/f141f628a25507134d521235ad41e5275e7fbe4c))

## [0.4.5](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.4...v0.4.5) (2025-10-21)


### Bug Fixes

* simplify bin configuration for standalone execution ([d154cde](https://github.com/skippr-hq/mcp-x-ray/commit/d154cdeb5064a050f89f18d3b05d37b19b11b40f))

## [0.4.4](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.3...v0.4.4) (2025-10-21)

## [0.4.3](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.2...v0.4.3) (2025-10-21)


### Bug Fixes

* rename bin to mcp-x-ray for npx compatibility and derive version from package.json ([8b77163](https://github.com/skippr-hq/mcp-x-ray/commit/8b771630589496bcdbb7766f2a02acf04311079f))

## [0.4.2](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.1...v0.4.2) (2025-10-21)

## [0.4.1](https://github.com/skippr-hq/mcp-x-ray/compare/v0.4.0...v0.4.1) (2025-10-21)

# 0.4.0 (2025-10-21)


### Bug Fixes

* add shebang to enable npm bin executable ([456090d](https://github.com/skippr-hq/mcp-x-ray/commit/456090dc84b8189259ad6f86821acfd2fe360a8f))


### Features

* Add issue handler to handle issues coming from the extension ([6b5686a](https://github.com/skippr-hq/mcp-x-ray/commit/6b5686a422631774ceb2622ac63844ff97ecbf27))
* add restart websocket and enable bi directional communication ([65e5028](https://github.com/skippr-hq/mcp-x-ray/commit/65e5028ac9e15df79ef1d8206615403c5c6619c5))
* Added basic mcp to receive messages from extension ([19d8066](https://github.com/skippr-hq/mcp-x-ray/commit/19d8066a47b1e68b47db8883ade88f9d6474fc6a))
* implement read-only MCP tools for Skippr issues ([9a189f7](https://github.com/skippr-hq/mcp-x-ray/commit/9a189f73cb920c2b8b85aa304eb64dddd8845cf8))
* Implemented get-issues and get-issue-details mcp functions ([59c69d4](https://github.com/skippr-hq/mcp-x-ray/commit/59c69d4ef000c42bb548b7263568682e0e0896ba))
* prepare MCP server for NPM package publication ([96031f3](https://github.com/skippr-hq/mcp-x-ray/commit/96031f35e0d3773cbf0a4331b87081eb8285a5ce))
* Remove console logs for debugging mcp connection issue ([36361d8](https://github.com/skippr-hq/mcp-x-ray/commit/36361d84a71de310ccc6fa17f4a3f799b5330fe4))
* Remove enforced skippr root dir from mcp ([#4](https://github.com/skippr-hq/mcp-x-ray/issues/4)) ([9853ba6](https://github.com/skippr-hq/mcp-x-ray/commit/9853ba68f2bd3e19dea109dbd73d61758bf67158))

# 0.3.0 (2025-10-21)

### Bug Fixes

* add shebang to enable npm bin executable ([456090d](https://github.com/skippr-hq/mcp-x-ray/commit/456090dc84b8189259ad6f86821acfd2fe360a8f))

### Features

* Add issue handler to handle issues coming from the extension ([6b5686a](https://github.com/skippr-hq/mcp-x-ray/commit/6b5686a422631774ceb2622ac63844ff97ecbf27))
* add restart websocket and enable bi directional communication ([65e5028](https://github.com/skippr-hq/mcp-x-ray/commit/65e5028ac9e15df79ef1d8206615403c5c6619c5))
* Added basic mcp to receive messages from extension ([19d8066](https://github.com/skippr-hq/mcp-x-ray/commit/19d8066a47b1e68b47db8883ade88f9d6474fc6a))
* implement read-only MCP tools for Skippr issues ([9a189f7](https://github.com/skippr-hq/mcp-x-ray/commit/9a189f73cb920c2b8b85aa304eb64dddd8845cf8))
* Implemented get-issues and get-issue-details mcp functions ([59c69d4](https://github.com/skippr-hq/mcp-x-ray/commit/59c69d4ef000c42bb548b7263568682e0e0896ba))
* prepare MCP server for NPM package publication ([96031f3](https://github.com/skippr-hq/mcp-x-ray/commit/96031f35e0d3773cbf0a4331b87081eb8285a5ce))
* Remove console logs for debugging mcp connection issue ([36361d8](https://github.com/skippr-hq/mcp-x-ray/commit/36361d84a71de310ccc6fa17f4a3f799b5330fe4))
* Remove enforced skippr root dir from mcp ([#4](https://github.com/skippr-hq/mcp-x-ray/issues/4)) ([9853ba6](https://github.com/skippr-hq/mcp-x-ray/commit/9853ba68f2bd3e19dea109dbd73d61758bf67158))
