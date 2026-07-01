---
name: Menu Images Integration
description: How food photos are stored and referenced in the app
---

# Source
Original images in: "Меню ресторана Гастропаб Чехов _ Россия Ярославль Щапова 1_files/"
275 .webp files named with Russian dish names + hash suffixes

# Destination
public/menu-images/{item.id}.webp (275 files)

# Mapping
Created by parsing HTML for aria-label="Подробнее о {name}" + img src pattern
Each menu item in menu.json now has image field: "/menu-images/{id}.webp" or null

# To regenerate
Run the Python script that matches item.name → HTML image → copies to public/menu-images/
