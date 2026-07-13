-- Fix known size typo variants like 5-5 -> 5-6 across stored product variants.

WITH normalized_products AS (
    SELECT
        id,
        jsonb_agg(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    variant_item,
                                    '{option1_value}',
                                    to_jsonb(
                                        CASE
                                            WHEN COALESCE(variant_item->>'option1_value', '') ~* '^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$' THEN
                                                CASE
                                                    WHEN COALESCE(variant_item->>'option1_value', '') ~* 'years?|yrs?|yr' THEN '5-6 Year'
                                                    WHEN COALESCE(variant_item->>'option1_value', '') ~* 'y$' THEN '5-6Y'
                                                    ELSE '5-6'
                                                END
                                            ELSE COALESCE(variant_item->>'option1_value', '')
                                        END
                                    ),
                                    true
                                ),
                                '{option2_value}',
                                to_jsonb(
                                    CASE
                                        WHEN COALESCE(variant_item->>'option2_value', '') ~* '^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$' THEN
                                            CASE
                                                WHEN COALESCE(variant_item->>'option2_value', '') ~* 'years?|yrs?|yr' THEN '5-6 Year'
                                                WHEN COALESCE(variant_item->>'option2_value', '') ~* 'y$' THEN '5-6Y'
                                                ELSE '5-6'
                                            END
                                        ELSE COALESCE(variant_item->>'option2_value', '')
                                    END
                                ),
                                true
                            ),
                            '{option3_value}',
                            to_jsonb(
                                CASE
                                    WHEN COALESCE(variant_item->>'option3_value', '') ~* '^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$' THEN
                                        CASE
                                            WHEN COALESCE(variant_item->>'option3_value', '') ~* 'years?|yrs?|yr' THEN '5-6 Year'
                                            WHEN COALESCE(variant_item->>'option3_value', '') ~* 'y$' THEN '5-6Y'
                                            ELSE '5-6'
                                        END
                                    ELSE COALESCE(variant_item->>'option3_value', '')
                                END
                            ),
                            true
                        ),
                        '{title}',
                        to_jsonb(
                            CASE
                                WHEN COALESCE(variant_item->>'title', '') ~* '^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$' THEN
                                    CASE
                                        WHEN COALESCE(variant_item->>'title', '') ~* 'years?|yrs?|yr' THEN '5-6 Year'
                                        WHEN COALESCE(variant_item->>'title', '') ~* 'y$' THEN '5-6Y'
                                        ELSE '5-6'
                                    END
                                ELSE COALESCE(variant_item->>'title', '')
                            END
                        ),
                        true
                    ),
                    '{name}',
                    to_jsonb(
                        CASE
                            WHEN COALESCE(variant_item->>'name', '') ~* '^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$' THEN
                                CASE
                                    WHEN COALESCE(variant_item->>'name', '') ~* 'years?|yrs?|yr' THEN '5-6 Year'
                                    WHEN COALESCE(variant_item->>'name', '') ~* 'y$' THEN '5-6Y'
                                    ELSE '5-6'
                                END
                            ELSE COALESCE(variant_item->>'name', '')
                        END
                    ),
                    true
                ),
                '{size}',
                to_jsonb(
                    CASE
                        WHEN COALESCE(variant_item->>'size', '') ~* '^5\s*[-–]\s*5(?:\s*(?:years?|yrs?|yr|y))?$' THEN
                            CASE
                                WHEN COALESCE(variant_item->>'size', '') ~* 'years?|yrs?|yr' THEN '5-6 Year'
                                WHEN COALESCE(variant_item->>'size', '') ~* 'y$' THEN '5-6Y'
                                ELSE '5-6'
                            END
                        ELSE COALESCE(variant_item->>'size', '')
                    END
                ),
                true
            )
        ) AS normalized_variants
    FROM products
    CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(variants::jsonb) = 'array' THEN variants::jsonb ELSE '[]'::jsonb END) AS variant_item
    WHERE variants IS NOT NULL
    GROUP BY id
)
UPDATE products AS p
SET variants = normalized_products.normalized_variants,
    updated_at = NOW()
FROM normalized_products
WHERE p.id = normalized_products.id
  AND p.variants::jsonb IS DISTINCT FROM normalized_products.normalized_variants;