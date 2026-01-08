import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const businesses = [
    { name: "Crafty Creations", owner: "Alice Johnson", plan: "Premium", joined: "2023-01-15", status: "Active" },
    { name: "Modern Munchies", owner: "Bob Williams", plan: "Standard", joined: "2023-03-22", status: "Active" },
    { name: "Gadget Grove", owner: "Charlie Brown", plan: "Basic", joined: "2023-05-10", status: "Inactive" },
    { name: "Urban Threads", owner: "Diana Miller", plan: "Enterprise", joined: "2023-06-01", status: "Active" },
];

export default function BusinessesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Businesses</CardTitle>
        <CardDescription>
          A list of all businesses registered on ShopFront.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription Plan</TableHead>
              <TableHead>Date Joined</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map(business => (
              <TableRow key={business.name}>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage src={`https://picsum.photos/seed/${business.name.replace(/\s+/g, '')}/36/36`} alt="Avatar" />
                            <AvatarFallback>{business.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div>{business.name}</div>
                            <div className="text-sm text-muted-foreground">{business.owner}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant={business.status === 'Active' ? 'default' : 'destructive'}>{business.status}</Badge>
                </TableCell>
                <TableCell>{business.plan}</TableCell>
                <TableCell>{business.joined}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Store</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
