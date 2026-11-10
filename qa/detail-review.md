# Model detail review

- Nano: fitted and centered 32 silkscreen labels in reserved areas; moved crystal, regulator, status LEDs and passives clear of markings; removed regulator/ISP overlap; recessed header pin ends below solder caps.
- Hub: separated passives from crystal can.
- Camera: separated controller and secondary IC; moved regulator clear of ceramics; kept 25 x 8 mm footprint.
- Servo: aligned three wire endpoints to connector lanes; smoothed cable and circular tessellation.
- All generated modules: separated small contact/text batches from shadow receivers/casters to reduce tiny surface artifacts. Increased round geometry resolution.
- Assembly: stable front-panel depth ordering; adjusted shadow bias; widened exploded-view framing while preserving LED/front-panel separation and existing part palette/visibility.

Validation: scripts/validate-bom.mjs passes for five exported GLBs, 7 replacement mappings, 32 unobscured Nano labels, and finite positions/normals of 26 original STEP meshes. npm run build passes (existing bundle-size advisory remains).

Browser review: five component models in qa/details.html; Nano/Hub/camera oblique and top views, LED front/rear, servo oblique; assembled, exploded and internal main-site views. No captured browser errors. This is a visual reconstruction, not manufacturer CAD; hidden internals and electrical routing are not fabrication-validated. Visual checks cover the reviewed views and do not establish a mathematical absence of every possible defect.
