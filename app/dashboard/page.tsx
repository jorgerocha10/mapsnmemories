import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function Dashboard() {
  const session = await auth()
  
  return (
    <div className="container max-w-6xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Welcome to your protected dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-bold">Session Info</h2>
          <pre className="mt-4 p-4 bg-muted rounded-md overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 