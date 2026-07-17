import "dotenv/config";
import { createServer } from "./app";

const port = Number(process.env.PORT ?? 3001);

createServer().then((app) => {
  app.listen(port, () => {
    console.log(`manYOUscript server listening on port ${port}`);
  });
});
