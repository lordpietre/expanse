import { validateComposePorts } from './actions/dockerActions';
import { Compose, Service, Image, PortMapping, Translator } from "@composecraft/docker-compose-lib";
import YAML from "yaml";

const compose = new Compose({ name: "test" });
const service = new Service({
    name: "db",
    image: new Image({ name: "postgres", tag: "latest" }),
    ports: [new PortMapping({ hostPort: 5432, containerPort: 5432 })]
});
compose.addService(service);
const dict = new Translator(compose).toDict();
const yaml = YAML.stringify(dict);
console.log(yaml);

validateComposePorts(yaml).then(console.log);
