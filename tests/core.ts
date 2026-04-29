import { Identifier } from "@foxystar/core";

Identifier.configure({ defaultNamespace: "foxystar" });

const identifier = Identifier.of("poggles");
console.log(identifier.toString());