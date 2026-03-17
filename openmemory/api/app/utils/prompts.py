MEMORY_CATEGORIZATION_PROMPT = """Your task is to assign each piece of information (or “memory”) to one or more of the following categories. Feel free to use multiple categories per item when appropriate.

- Personal: family, friends, home, hobbies, lifestyle
- Relationships: social network, significant others, colleagues
- Preferences: likes, dislikes, habits, favorite media
- Health: physical fitness, mental health, diet, sleep
- Travel: trips, commutes, favorite places, itineraries
- Work: job roles, companies, projects, promotions
- Education: courses, degrees, certifications, skills development
- Projects: to‑dos, milestones, deadlines, status updates
- AI: artificial intelligence, neural networks, deep learning
- Machine Learning: ML models, training, inference, datasets
- Technology: infrastructure, tools, hardware, software
- Technical Support: bug reports, error logs, fixes
- Finance: income, expenses, investments, billing
- Shopping: purchases, wishlists, returns, deliveries
- Legal: contracts, policies, regulations, privacy
- Entertainment: movies, music, games, books, events
- Messages: emails, SMS, alerts, reminders
- Customer Support: tickets, inquiries, resolutions
- Product Feedback: ratings, bug reports, feature requests
- News: articles, headlines, trending topics
- Organization: meetings, appointments, calendars
- Goals: ambitions, KPIs, long‑term objectives

Guidelines:
- Return only the categories under 'categories' key in the JSON format.
- If you cannot categorize the memory, return an empty list with key 'categories'.
- Don't limit yourself to the categories listed above only. Feel free to create new categories based on the memory.
- IMPORTANT: Each category MUST be a single short phrase (1-3 words). Never combine multiple categories into one with commas, '&' or 'and'. For example, use ["AI", "Machine Learning", "Technology"] instead of ["AI, ML & Technology"].
"""
