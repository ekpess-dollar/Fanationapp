/* Rename `chip-onart` to `onart`, with a count assertion per file.
 *
 * The modifier stopped being a chip modifier the moment it had to apply to a
 * pill, a tag and a glass panel too — those sit on the same photographs and
 * fail for the same reason. A blind global replace is how a rename like this
 * quietly eats an unrelated substring, so every file declares how many hits it
 * expects and the run aborts if any one of them disagrees.
 */
import fs from 'fs'

const EXPECT = [
  ['client/src/components/modals.tsx', 1],
  ['client/src/components/post-card.tsx', 1],
  ['client/src/routes/collections.tsx', 1],
  ['client/src/routes/messages.tsx', 1],
  ['client/src/routes/creator.tsx', 1],
  ['client/src/routes/studio/live.tsx', 1],
  ['client/src/routes/studio/content.tsx', 2],
  ['client/src/routes/studio/vault.tsx', 1],
  ['client/src/routes/explore.tsx', 1],
]

let total = 0
for (const [file, n] of EXPECT) {
  const src = fs.readFileSync(file, 'utf8')
  const hits = (src.match(/chip-mint chip-onart|chip-coin chip-onart/g) || []).length
  if (hits !== n) { console.error(`ABORT ${file}: expected ${n}, found ${hits}`); process.exit(1) }
  fs.writeFileSync(file, src.replace(/(chip-mint|chip-coin) chip-onart/g, '$1 onart'))
  total += hits
  console.log(`  ${file}  ${hits}`)
}
console.log(`\n  ${total} renamed`)
