"use client"

import { TrendingUp, Users, Utensils, QrCode } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Son 7 günlük veriler için örnek data
const chartData = [
  { day: "Pazartesi", tarama: 156 },
  { day: "Salı", tarama: 235 },
  { day: "Çarşamba", tarama: 247 },
  { day: "Perşembe", tarama: 173 },
  { day: "Cuma", tarama: 289 },
  { day: "Cumartesi", tarama: 314 },
  { day: "Pazar", tarama: 284 },
]

const chartConfig = {
  tarama: {
    label: "QR Tarama",
    color: "hsl(var(--chart-1))",
  }
} satisfies ChartConfig

export default function Dashboard() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Yönetim Paneli</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ana Chart Card */}
        <Card className="lg:col-span-2 lg:row-span-2 h-full">
          <CardHeader>
            <CardTitle>Haftalık QR Tarama İstatistikleri</CardTitle>
            <CardDescription>Son 7 günün QR kod tarama sayıları</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ChartContainer config={chartConfig} className="h-full">
              <AreaChart
                data={chartData}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Area
                  dataKey="tarama"
                  type="linear"
                  fill="var(--color-tarama)"
                  fillOpacity={0.4}
                  stroke="var(--color-tarama)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Geçen haftaya göre %12 artış</span>
            </div>
          </CardFooter>
        </Card>

        <div className="lg:col-span-1 space-y-4 h-full">
          {/* Aktif Menüler Card */}
          <Card className="h-2/3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Aktif Menüler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/20 p-2">
                      🍽️
                    </div>
                    <div>
                      <p className="font-semibold">Yaz Menüsü 2024</p>
                      <p className="text-sm text-muted-foreground">32 ürün</p>
                    </div>
                  </div>
                  <div className="flex h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-500/20" />
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-sm hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/20 p-2">
                      ☕
                    </div>
                    <div>
                      <p className="font-semibold">Kahvaltı Menüsü</p>
                      <p className="text-sm text-muted-foreground">18 ürün</p>
                    </div>
                  </div>
                  <div className="flex h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-500/20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR İstatistikleri Card */}
          <Card className="h-1/3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">5,678</p>
              <p className="text-sm text-muted-foreground">Toplam Tarama</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
