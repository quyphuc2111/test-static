"use client"

import { PublicHeader } from "@/components/layout/public-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  FileText, 
  Upload, 
  Share2, 
  Lock, 
  Zap, 
  Users, 
  Shield, 
  Database,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Globe,
  BookOpen
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="gap-1 px-3 py-1">
            <Sparkles className="h-3 w-3" />
            Hệ thống quản lý nội dung tĩnh thế hệ mới
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Static Content Server
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
            Giải pháp toàn diện cho việc quản lý, lưu trữ và phân phối nội dung tĩnh 
            một cách hiệu quả và an toàn
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="gap-2 text-lg px-8">
                Bắt đầu ngay
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Tìm hiểu thêm
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 w-full max-w-2xl">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">10TB+</div>
              <div className="text-sm text-muted-foreground">Dữ liệu</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Người dùng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24 bg-muted/30">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="mb-2">Tính năng</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">
            Mọi thứ bạn cần để quản lý nội dung
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Các tính năng mạnh mẽ được thiết kế để đơn giản hóa quy trình làm việc của bạn
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Upload Dễ dàng</CardTitle>
              <CardDescription>
                Tải lên và quản lý các file nội dung của bạn một cách đơn giản với giao diện kéo thả trực quan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Chia sẻ Linh hoạt</CardTitle>
              <CardDescription>
                Chia sẻ nội dung với người dùng khác thông qua link an toàn và quyền truy cập có thể kiểm soát
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Bảo mật Cao</CardTitle>
              <CardDescription>
                Hệ thống phân quyền RBAC toàn diện đảm bảo dữ liệu của bạn luôn được bảo vệ an toàn
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Hiệu suất Cao</CardTitle>
              <CardDescription>
                CDN tích hợp và caching thông minh đảm bảo tốc độ tải nhanh chóng cho nội dung của bạn
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Quản lý Người dùng</CardTitle>
              <CardDescription>
                Quản lý người dùng và vai trò một cách dễ dàng với dashboard quản trị trực quan
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lưu trữ Không giới hạn</CardTitle>
              <CardDescription>
                Lưu trữ không giới hạn với khả năng mở rộng tự động theo nhu cầu của bạn
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="mb-2">Về chúng tôi</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Giải pháp quản lý nội dung tĩnh toàn diện
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Static Content Server là một hệ thống quản lý nội dung tĩnh hiện đại, được xây dựng với các 
              công nghệ web tiên tiến nhất. Chúng tôi cung cấp một nền tảng an toàn, nhanh chóng và dễ sử dụng 
              để quản lý mọi loại nội dung tĩnh của bạn.
            </p>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Hỗ trợ SCORM</h3>
                  <p className="text-muted-foreground">Tích hợp đầy đủ với các gói SCORM để quản lý nội dung e-learning</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">API RESTful</h3>
                  <p className="text-muted-foreground">API RESTful đầy đủ cho phép tích hợp dễ dàng với các hệ thống khác</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Audit Logs</h3>
                  <p className="text-muted-foreground">Theo dõi mọi hoạt động với hệ thống audit logs chi tiết</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center">
              <Globe className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Global CDN</h3>
              <p className="text-sm text-muted-foreground">Phân phối nội dung toàn cầu</p>
            </Card>
            
            <Card className="p-6 text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">SSL/TLS</h3>
              <p className="text-sm text-muted-foreground">Mã hóa end-to-end</p>
            </Card>
            
            <Card className="p-6 text-center">
              <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Multi-format</h3>
              <p className="text-sm text-muted-foreground">Hỗ trợ nhiều định dạng file</p>
            </Card>
            
            <Card className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground">Tài liệu đầy đủ</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-12">
            <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                Sẵn sàng bắt đầu?
              </h2>
              <p className="text-lg text-muted-foreground">
                Đăng nhập ngay để trải nghiệm hệ thống quản lý nội dung tĩnh tốt nhất
              </p>
              <Link href="/login">
                <Button size="lg" className="gap-2 text-lg px-8">
                  Đăng nhập ngay
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SC</span>
              </div>
              <span className="font-semibold">Static Content Server</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2025 Static Content Server. All rights reserved.
            </p>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="#contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
