import { NextRequest, NextResponse } from 'next/server'
import { generateGuidePDF } from '@/lib/generateGuidePDF'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params
  const validLangs = ['fr', 'en', 'de', 'es', 'it', 'nl', 'pt']
  const safeLang = validLangs.includes(lang) ? lang : 'fr'

  const pdfBuffer = generateGuidePDF(safeLang.toUpperCase())

  return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="guide-voltpilot-${safeLang}.pdf"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
