import { AcquisitionCard, PlanFeatures } from '../components/acquisition'
import { type CardContent, resolveAddOnImage, resolveLogo } from './content'

/** Renders the edited content as a real `AcquisitionCard`. */
export function LiveCard({ content }: { content: CardContent }) {
  const logos = content.logos.items
    .map(resolveLogo)
    .filter((l): l is NonNullable<typeof l> => l !== null)

  const parsedTotal = Number.parseInt(content.logos.total, 10)
  const total = Number.isFinite(parsedTotal) ? parsedTotal : undefined

  const addOnImage = resolveAddOnImage(content)

  return (
    <AcquisitionCard
      device={content.device}
      ultimate={content.ultimate}
      eyebrow={content.eyebrow || undefined}
      title={content.title}
      description={content.description}
      moreLabel={content.moreLabel}
      onMore={() => undefined}
      pricing={{
        caption: content.pricing.caption,
        price: content.pricing.price,
        crossedPrice: content.pricing.crossedPrice || undefined,
        installment: content.pricing.installment,
        extraInfo: content.pricing.extraInfo || undefined,
      }}
      ctaLabel={content.ctaLabel}
      discount={content.discount}
      discountLabel={content.discountLabel}
      logos={logos.length ? { logos, rows: content.logos.rows, total } : undefined}
      addOn={
        content.addOn.enabled && addOnImage
          ? {
              type: content.addOn.type,
              imageSrc: addOnImage,
              title: content.addOn.title,
              subtitle: content.addOn.subtitle,
              planName: content.addOn.planName,
              price: content.addOn.price,
              codeLabel: content.addOn.codeLabel,
            }
          : undefined
      }
      features={<PlanFeatures features={content.features} device={content.device} />}
      footerLabel={content.footerLabel || undefined}
    />
  )
}
