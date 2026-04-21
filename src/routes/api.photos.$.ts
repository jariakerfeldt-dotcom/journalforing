import { createFileRoute } from '@tanstack/react-router'
import { getPhoto } from '@/server/storage'

export const Route = createFileRoute('/api/photos/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = `photos/${(params as { _splat: string })._splat}`
        const photo = await getPhoto(key)
        if (!photo) {
          return new Response('Not found', { status: 404 })
        }
        return new Response(photo.data, {
          headers: {
            'Content-Type': photo.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
