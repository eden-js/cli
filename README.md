# EdenJS
[![bitHound Overall Score](https://img.shields.io/bithound/code/github/eden-js/cli.svg?label=bitHound%20Overall%20Score&style=flat-square)](https://www.bithound.io/github/eden-js/cli)
[![Issues](https://img.shields.io/github/issues/eden-js/cli.svg?style=flat-square)](https://github.com/eden-js/cli/issues)
[![Dependencies](https://david-dm.org/eden-js/cli.svg?style=flat-square)](https://github.com/eden-js/cli)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/eden-js/cli)
[![Awesome](https://img.shields.io/badge/awesome-true-green.svg?style=flat-square)](https://github.com/eden-js/cli)

Awesome isomorphic NodeJS skeleton for structured applications. Just have a look at the "bundles" that make up an EdenJS application.

## Getting Started
These instructions will get a copy of the project up and running on your local machine.

See deployment for notes on how to deploy the project.

### Prerequisites
Required software to install and run EdenJS:

* [Node.js](http://nodejs.org/)
* [MongoDB](https://www.mongodb.com/)
* [redis](https://redis.io/)

### Installation
```
// Generate new project
npm i -g @edenjs/cli
mkdir project
cd project
edenjs init app
npm install --save @edenjs/core bootstrap
edenjs run
```

### Deployment
```
// Docker
docker build . -t edenjs/eden
docker push edenjs/eden

// Docker-Compose
Will deploy redis and mongodb locally for testing/development
docker-compose up -d
```

```
// kubernetes

Deploy redis and mongodb.
Our prefered method is via helm

// Install mongodb-replicaset
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm install --name my-release stable/mongodb-replicaset

// Install redis
helm install stable/redis
Get the config values from these and edit config.js

// Create configmap
kubectl create configmap eden-configmap--from-file=config.js=config.js

// Deploy EdenJS
kubectl apply -f kubernetes.yml

// Optional for Continious Deployment
Will poll the registry every minute for image changes and do a rolling release on production

helm repo add keel-charts https://charts.keel.sh
helm repo update
helm upgrade --install keel --namespace=kube-system keel-charts/keel
```

### Running the tests
```
// Test EdenJS with NPM
npm test;
```

### Deployment
```
// Run in production
edenjs start
```

### Tutorial

A basic tutorial on how to get started with EdenJS is available: [TUTORIAL.md](TUTORIAL.md/)

## Built With

* [Express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js.
* [socket.io](https://socket.io/) - Node.js realtime framework server.
* [Riot.js](https://riot.js.org/) - Simple and elegant component-based UI library.
* [Mongorito](http://mongorito.com/) - MongoDB ODM for Node.js based on ES6 generators. No callbacks or promises.

## Versioning
We use [SemVer](http://semver.org/) for versioning.

## Authors
* **Alex Taylor** - *Lead Developer* - [EdenCoder](https://github.com/EdenCoder)
* **installgen2** - *Developer* - [notgne2](https://github.com/notgne2)
* **Jack Taylor** - *Developer* - [OhYea777](https://github.com/OhYea777)
* **Mike Mackenzie** - *Documentation* / *Developer* - [veb](https://github.com/veb)

See also the list of [contributors](https://github.com/eden-js/cli/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
