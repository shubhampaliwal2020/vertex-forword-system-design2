import { OpenTelemetry } from '@ai-sdk/otel'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { PostHogSpanProcessor } from '@posthog/ai/otel'
import { registerTelemetry } from 'ai'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

if ((!posthogKey || !posthogHost) && process.env.NODE_ENV === 'development') {
  const missingVariable = !posthogKey ? 'NEXT_PUBLIC_POSTHOG_KEY' : 'NEXT_PUBLIC_POSTHOG_HOST'
  throw new Error(`${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`)
}

export const posthogSpanProcessor = posthogKey && posthogHost
  ? new PostHogSpanProcessor({projectToken: posthogKey, host: posthogHost})
  : null

export const posthogLoggerProvider = posthogKey && posthogHost
  ? new LoggerProvider({
      resource: resourceFromAttributes({'service.name': 'forward-search'}),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${posthogHost.replace(/\/$/, '')}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${posthogKey}`,
              'Content-Type': 'application/json',
            },
          }),
        }),
      ],
    })
  : null

export const posthogSearchLogger = posthogLoggerProvider?.getLogger('forward.posthog-search')

export function register() {
  if (!posthogSpanProcessor) return

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({'service.name': 'forward-search'}),
    spanProcessors: [posthogSpanProcessor],
  })

  sdk.start()

  registerTelemetry(
    new OpenTelemetry({
      enrichSpan: ({runtimeContext}) => ({
        environment: typeof runtimeContext?.properties === 'object' && runtimeContext.properties !== null && 'environment' in runtimeContext.properties && typeof runtimeContext.properties.environment === 'string'
          ? runtimeContext.properties.environment
          : undefined,
        'posthog.distinct_id': typeof runtimeContext?.distinctId === 'string' ? runtimeContext.distinctId : undefined,
        '$ai_session_id': typeof runtimeContext?.sessionId === 'string' ? runtimeContext.sessionId : undefined,
        '$ai_trace_name': typeof runtimeContext?.traceName === 'string' ? runtimeContext.traceName : undefined,
      }),
    }),
  )
}
