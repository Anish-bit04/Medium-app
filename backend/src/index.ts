import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import bcrypt from "bcryptjs";
import { decode, sign, verify } from "hono/jwt";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

app.use("/api/v1/blog/*", async (c, next) => {
  const jwt = c.req.header("Authorization");
  if (!jwt) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
  const token = jwt.split(" ")[1];
  try{
    const payload = await verify(token, c.env.JWT_SECRET);

    if (!payload || !payload.id) {
      c.status(401);
      return c.json({ error: "unauthorized" });
    }
    c.set("userId", payload.id);
    await next();

  }catch(error){
    c.status(401)
    return c.json({error:'invalid token'})
  }
  
});

app.post("/api/v1/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { email, password } = body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    const userId = user.id;
    const token = await sign({ id: userId }, c.env.JWT_SECRET);

    return c.json({ message: "User created successfully", token }, 201);
  } catch (error) {
    return c.json({ error: "Error creating user" }, 403);
  }
});

app.post("/api/v1/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { email, password } = body;

  try {
    const existUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!existUser) {
      c.status(403);
      return c.json({ error: "user not found" });
    }

    const verifyPass = await bcrypt.compare(password, existUser.password);
    if (!verifyPass) {
      c.status(411);
      return c.json({
        message: "Incorrect username or password",
      });
    }

    const userId = existUser.id;
    const token = await sign({ id: userId }, c.env.JWT_SECRET);
    return c.json({ message: "User Signin successfully", token }, 201);
  } catch (error) {
    return c.json({ error: "Error while Signin user" }, 403);
  }
});

app.get("/api/v1/blog/:id", (c) => {
  const id = c.req.param("id");
  console.log(id);
  return c.text("get blog route");
});

app.post("/api/v1/blog", (c) => {
  console.log(c.get("userId"));
  return c.json({
    conosle: c.get('userId')
  });
});

app.put("/api/v1/blog", (c) => {
  return c.text("signin route from put");
});

export default app;
