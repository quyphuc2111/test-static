"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Copy } from "lucide-react"

const templates = [
  {
    id: 1,
    name: "Administrator",
    description: "Quản trị viên với quyền truy cập đầy đủ vào hệ thống",
    permissions: 18,
    category: "Quản lý",
    popular: true,
    features: [
      "Quản lý người dùng và vai trò",
      "Cấu hình hệ thống",
      "Truy cập tất cả nội dung",
      "Xem báo cáo và thống kê",
      "Quản lý bảo mật",
    ],
  },
  {
    id: 2,
    name: "Content Manager",
    description: "Người quản lý nội dung với quyền tạo và chỉnh sửa",
    permissions: 8,
    category: "Nội dung",
    popular: true,
    features: [
      "Tạo và chỉnh sửa nội dung",
      "Quản lý dự án và module",
      "Xem tất cả nội dung",
      "Chia sẻ nội dung",
      "Xem thống kê cơ bản",
    ],
  },
  {
    id: 3,
    name: "Developer",
    description: "Nhà phát triển với quyền truy cập kỹ thuật",
    permissions: 12,
    category: "Kỹ thuật",
    popular: false,
    features: [
      "Truy cập API",
      "Xem logs hệ thống",
      "Quản lý integrations",
      "Truy cập database (read-only)",
      "Xem cấu hình kỹ thuật",
    ],
  },
  {
    id: 4,
    name: "Tester",
    description: "Người kiểm thử với quyền xem và test",
    permissions: 6,
    category: "Kiểm thử",
    popular: false,
    features: [
      "Xem nội dung",
      "Xem dự án và module",
      "Xem người dùng",
      "Xem thống kê dashboard",
      "Truy cập giới hạn",
    ],
  },
]

export function RoleTemplates() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Mẫu vai trò có sẵn</h3>
        <p className="text-muted-foreground">
          Sử dụng các mẫu vai trò được thiết kế sẵn để nhanh chóng tạo vai trò mới cho hệ thống của bạn
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            {template.popular && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-primary">Phổ biến</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary">{template.category}</Badge>
                <Badge variant="outline">{template.permissions} quyền</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tính năng chính:</h4>
                <ul className="space-y-1.5">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full bg-transparent" variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Sử dụng mẫu này
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


