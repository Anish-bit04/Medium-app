import { Hono } from "hono";
import { userRouter } from "../routes/user";
import { blogRouter } from "../routes/blog";

const app = new Hono();

// use middleware to set prisma value to all route 
// app.use('*',(c)=>{
//   const prisma = new PrismaClient({
//     datasourceUrl: c.env?.DATABASE_URL,
//   }).$extends(withAccelerate());
//   c.set('prisma',prisma)
// })

app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)

export default app;
