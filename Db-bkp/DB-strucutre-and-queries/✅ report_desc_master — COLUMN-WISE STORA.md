✅ report_desc_master — COLUMN-WISE STORAGE GUIDE

    1️⃣ ReportId (FK)
        What:
            Reference to report_master.Id
        Format:
            INT (existing)
        Rule:
            One active row per report (1:1 logical relationship)

    2️⃣ Keywords
        Purpose:
            SEO keywords
            Internal tagging
            NOT meta-keywords (Google ignores them)
            Format (IMPORTANT):
            Comma-separated keywords (lowercase, trimmed)
        Example:
            ev battery market, electric vehicle battery, lithium ion battery market
        Rules:
            3–6 keywords max
            No stuffing
            No pipes (|)
            No long sentences

    3️⃣ Title
        Purpose:
            Optional SEO H1 override
            Used when report name is too long
        Format:
            Plain text (NO HTML)
        Example:
            EV Battery Market Size, Share and Forecast, 2024–2030
        Rules:
            60–90 characters
            Sentence case
            No keywords stuffing

    4️⃣ ReportDesc (MOST IMPORTANT)
        Purpose:
            Executive summary
            Main SEO content
            Used for snippets & indexing
        Format:
            Clean HTML OR structured markdown-like HTML
            RECOMMENDED FORMAT (HTML):
            <p>The global EV battery market was valued at USD 91.9 billion in 2024 and is expected to grow at a CAGR of 9.6% during the forecast period.</p>
            <ul>
            <li>Increasing adoption of electric vehicles</li>
            <li>Government incentives and emission regulations</li>
            <li>Advancements in battery chemistry</li>
            </ul>
            <p>Asia Pacific dominates the market due to large-scale EV production in China.</p>
        Rules:
            300–700 words
            Use <p>, <ul>, <li>
            NO inline styles
            NO <h1> inside
        Avoid tables here

    5️⃣ TableOfContents
        Purpose:
            Report structure
            Buyer confidence
            UI accordion rendering
        Format:
            [
                {
                    "section": "Introduction",
                    "items": [
                    "Market definition",
                    "Scope of the study"
                    ]
                },
                {
                    "section": "Market Dynamics",
                    "items": [
                    "Drivers",
                    "Restraints",
                    "Opportunities"
                    ]
                },
                {
                    "section": "Competitive Landscape",
                    "items": [
                    "Market share analysis",
                    "Company profiles"
                    ]
                }
            ]
        Rules:
            Valid JSON only
            No HTML inside JSON
            Max depth = 2 levels
            Consistent naming
        
    6️⃣ Segments
        Purpose:
            Market segmentation (SEO + buyer clarity)
            Format (HTML):
            <p><strong>By Battery Type:</strong> Lithium-ion, Lead-acid, Solid-state</p>
            <p><strong>By Vehicle Type:</strong> Passenger EVs, Commercial EVs</p>
            <p><strong>By Region:</strong> North America, Europe, Asia Pacific</p>
        Rules:
            Use <strong> labels
            Short, scannable
            No JSON here (HTML is better for SEO)

    7️⃣ Methodology
        Purpose:
            Trust & compliance
            Enterprise buyers care a lot
        Format (HTML):
            <p>This study involves extensive secondary research and primary interviews with industry experts.</p>
            <p>Data triangulation and market breakdown procedures were used to estimate market size.</p>
        Rules:
            150–300 words
            Plain paragraphs
            No marketing fluff

    8️⃣ ReportScope
        Purpose:
            Clarify inclusions/exclusions
            Reduce pre-sales questions
        Format (HTML):
            <ul>
            <li>Market size and forecast by value (USD)</li>
            <li>Coverage of major EV battery chemistries</li>
            <li>Regional analysis across 5 key regions</li>
            </ul>
        Rules:
            Bullet points only
            Clear and precise

    9️⃣ ImagePath
        Purpose:
            Optional cover / infographic image
        Format:
            /uploads/reports/70098/cover.webp
        Rules:
            One image only
            Do NOT store multiple images here
            Charts go to report_media table

    🔟 Author
        Purpose:
            Trust & credibility
        Format:
            First Last
        Example:
            Rahul Sharma

    1️⃣1️⃣ Rating
        Purpose:
            Display star rating
            Rich snippets (later)
        Format:
            4.5 / 5
        Rules:
            Store as string or decimal consistently
            Optional early stage

    1️⃣2️⃣ Reviews
        Purpose:
            Social proof
        Format:
            INT
        Example:
            8

    1️⃣3️⃣ PublishDate
        Purpose:
            Freshness
            Trust
            SEO
        Format:
            YYYY-MM-DD
        Example:
            2024-06-15

    1️⃣4️⃣ NoOfPages
        Purpose:
            Buyer expectation
        Format:
            Numeric as string OR range
        Example:
            210
            or
            180–220

    1️⃣5️⃣ Indate
        Purpose:
            Legacy field (optional)
        Recommendation:
            Deprecate or repurpose as last_updated