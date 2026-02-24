import { PortMapping } from "@composecraft/docker-compose-lib";
const pm = new PortMapping({ hostPort: 5432, containerPort: 5432 });
console.log(pm.toString());
