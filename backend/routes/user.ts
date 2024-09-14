import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import bcrypt from 'bcryptjs'

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_SECRET: string;
    }
}>();

userRouter.post("/signup", async (c) => {
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
  
  userRouter.post("/signin", async (c) => {
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