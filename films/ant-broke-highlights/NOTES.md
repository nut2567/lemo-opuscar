# Ant Broke highlights — production notes

Creative review notes kept from production; orchestration and tool details are
omitted.

## Concept read

- **Parcel Panic reads fastest** in a one-second glance — the scale gag lands
  immediately.
- **Clay Checkout**: for the gag to read, both buy buttons must be depressed at
  antenna contact.
- **Empty Winter**: show the open box interiors and a sale price on the phone.

## If animated

- Build to the paired tap in shot 08.
- Hold the blocked entrance in shot 11.
- Reuse the once-full shelf layout from shot 03 in shot 18.

## Animation directions (from code review of `render.py`)

- **Clay Checkout**: accelerate alternating antenna taps, then hold a simultaneous
  press. Drive the contact points and the button press from the same timing values
  so the tips stay aligned with both screens.
- **Parcel Panic**: drop the giant parcel into place with a short impact shake,
  then hold on the blocked doorway. Keep a visible edge of the nest behind the
  parcel throughout the move so the scale reads in portrait.
- **Empty Winter**: reuse the shelf layout from the earlier stocked room, then make
  a slow push toward the empty shelves and ant. Keep the open tops of the boxes
  and the lit phone visible throughout the push.
