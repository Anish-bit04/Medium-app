import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import bcrypt from 'bcryptjs'
import { decode, sign, verify } from 'hono/jwt'

const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
    JWT_SECRET: string
	}
}>()


app.post('/api/v1/signup', async (c) => {
  const prisma = new PrismaClient({
      datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate())
  const body = await c.req.json()
  const {email,password} = body

  try{
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)

    const user = await prisma.user.create({
      data:{
        email,
        password: hashedPassword
      }
    })
    const userId = user.id
    const jwt_secret = c.env.JWT_SECRET
    const token = await sign({id:userId},jwt_secret)

    return c.json({ message: 'User created successfully', token }, 201)
  }catch(error){
   return c.json({ error: 'Error creating user' }, 403)
  
}})

app.post('/api/v1/signin', (c) => {
	return c.text('signin route')
})

app.get('/api/v1/blog/:id', (c) => {
	const id = c.req.param('id')
	console.log(id);
	return c.text('get blog route')
})

app.post('/api/v1/blog', (c) => {

	return c.text('signin route')
})

app.put('/api/v1/blog', (c) => {
	return c.text('signin route')
})

export default app
