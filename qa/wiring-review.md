# Wiring tutorial review

Scope: wiring only. Removed the three assembly-position lessons and all part-placement animation code. Seven lessons cover D3/D5/D6 servo signals, D10 CS / D11 CLK / D12 DIN, and three selectable USB connections.

One renderer serves explorer and tutorial. Tutorial copies reuse mesh geometry and own cloned materials; explorer visibility, selection, orbit target, camera position and rotation state are retained across mode changes. Teaching view supports relation layout / installed positions, per-step replay, previous/next and projected endpoint labels. Curved wires are illustrative connection paths, not final in-product harness routing. Connector/pin positions refer to reconstructed display models.

Validation: production build, existing BOM and explosion checks pass. Browser exercised all six signal lessons, USB branch selection, installed/relation switch and a mode round-trip with a hidden printed part (remained hidden). No errors in the clean review tab. No hardware validation, power harness or inter-matrix wiring is claimed.

## Routing revision
Removed installed-position selector and its branch. All lessons use the separated connection layout. Connector-axis exit segments now lead to a shallow routing plane beyond module envelopes, with perimeter lanes and short rounded corners. Cable radius 0.01 scene units. USB socket exit points moved clear of retaining lips. `node scripts/validate-wiring.mjs` checks 9 routes against the actual reconstructed mesh surfaces at 700 centerline intervals plus 8 tube-edge samples each; intentional endpoint contact zones are excluded (0.001 centerline / 0.018 tube-edge units). All checks pass. Browser servo and USB routes reviewed; no captured errors. This verifies displayed geometry, not physical harness design.

USB branches now render only their participating modules and update the part list and framing. Removed perimeter stair-step lanes; routes use direct collision-clear exit spans or visibility-safe shortcuts through the shallow clearance plane. Nine route surface/radius checks and build pass after simplification.
