'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUserTickets } from "@/hooks/use-events"
import { formatDate } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export default function MyTicketsPage() {
  const { user } = useAuth()
  const { tickets, loading, error } = useUserTickets()

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">My Tickets</h1>
          <p className="text-muted-foreground mb-4">Please sign in to view your tickets</p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">My Tickets</h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">My Tickets</h1>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error loading tickets: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
        <p className="text-muted-foreground">
          {tickets.length === 0
            ? "You haven't purchased any tickets yet"
            : `You have ${tickets.length} ticket(s)`
          }
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tickets found</p>
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((order: any) => (
            <Card key={order.id} className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6">
                {/* Header with Order ID and Date */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-zinc-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <h3 className="text-white font-medium">
                      Order # {order.id.slice(-8)}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">State:</span>
                      <span className="text-white">{order.status}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-white">
                        ${(order.total_amount || order.total_price || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">State:</span>
                      <span className="text-white">{order.status}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Validation:</span>
                      <span className="text-white">
                        {order.status === 'paid' || order.status === 'confirmed' ? 'Validated' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment method:</span>
                      <span className="text-white">{order.payment_method || 'card'}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">QR Code:</span>
                      <span className="text-white text-xs font-mono">
                        {order.qr_code || order.items?.[0]?.qr_code || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`${
                        ['paid', 'confirmed'].includes(order.status)
                          ? 'text-lime-400'
                          : order.status === 'waiting_payment'
                            ? 'text-yellow-400'
                            : 'text-gray-400'
                      }`}>
                        {order.status === 'waiting_payment' ? 'Waiting for Payment' :
                         ['paid', 'confirmed'].includes(order.status) ? 'Paid' : order.status}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Event:</span>
                      <span className="text-white text-right">
                        {order.events?.title || 'Event'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white">
                        {order.events?.date ? formatDate(order.events.date) : 'TBD'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white text-right">
                        {order.events?.location || 'TBD'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Tickets:</span>
                      <span className="text-white">
                        {order.items?.length || 0} ticket(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* See Details Button */}
                <div className="border-t border-zinc-800 pt-4">
                  <Link href={`/confirmation?orderId=${order.id}`}>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      See details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
