import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"

export const UnderConstruction = () => {
    return (
        <div className="h-[90dvh] grid place-items-center p-4">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-muted p-4 rounded-full">
                        <Construction className="h-12 w-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                            Yapım Aşamasında
                        </h1>
                        <p className="text-muted-foreground">
                            Bu sayfa aktif olarak geliştiriliyor
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground text-center">
                    Lütfen daha sonra tekrar kontrol ediniz. Anlayışınız için teşekkür ederiz.
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <a href="/dashboard">
                            Yönetim Paneline Dön
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}; 