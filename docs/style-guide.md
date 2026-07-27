# Style guide

House rules for garden writing. Applies to task guides, plant guides, and client
deliverables.

## Voice

The models are Robin Kinross and Robert Wearing. Both write flat, and both
assume the reader is capable.

- Few adjectives, ideally none. Detail carries the color, not description.
- Understated comparisons. If a thing is unusual, say what it does differently
  and let the reader draw the conclusion.
- Superlative confidence in the stated position. Give the instruction. Do not
  hedge it with 'you might consider' or 'some gardeners prefer'.
- Second person. 'Leave 8–24in of stubble', not 'stubble should be left'.
- Encouragement is a statement of fact about the plant, not about the reader.
  'Nothing you remove is alive' works. 'Don’t worry, you’ve got this' reads as
  condescension.
- Give the consequence in both directions: what happens if the task is done
  badly, and what happens if it is skipped. Two outcomes is information. One
  outcome is a warning.

## Mechanics

- No em dashes. Use en dashes with no spaces around them, for ranges: 8–24in.
- Sentence case for titles and subheads.
- Single quotes in preference to double.
- Always curly quotes and apostrophes (‘ ’ “ ”), never straight ones.
- Lowercase for units, am/pm, and filenames.
- No space between a number and its unit, or a time and am/pm: 7mm, 2ft, 9:00pm.
- Commas tuck inside quotes.
- One space after a period.
- Oxford comma.

## Spelling

US spelling throughout. Check by matching stems, not whole words: a check
bounded to whole words catches ‘neighbour’ and misses ‘neighbours’, which is
how British forms survive a first pass.

**-our to -or**
colour/color · neighbour/neighbor · favour/favor · behaviour/behavior ·
labour/labor · odour/odor · vigour/vigor · harbour/harbor · humour/humor

**-ise and -yse to -ize and -yze**
fertilise/fertilize · recognise/recognize · organise/organize ·
realise/realize · analyse/analyze

**-re to -er**
centre/center · metre/meter · litre/liter

**Doubled l before a suffix**
travelled/traveled · cancelled/canceled · labelled/labeled · fuelled/fueled ·
modelled/modeled · bevelled/beveled · shrivelled/shriveled ·
unravelled/unraveled

**-ce to -se (nouns)**
defence/defense · offence/offense · licence/license

**Other pairs**
grey/gray · mould/mold · catalogue/catalog · programme/program ·
storey/story · ageing/aging · judgement/judgment · enquire/inquire ·
kerb/curb · plough/plow · draught/draft · sceptic/skeptic ·
aluminium/aluminum · speciality/specialty · practise/practice ·
tyre/tire · sulphur/sulfur

**Word choice, not spelling, but US garden norm**
autumn → fall · whilst → while · amongst → among · learnt → learned ·
spelt → spelled · towards → toward

## Timing

Name the portion of the season, then give the natural indicator that tells the
reader they have arrived: 'Early spring, once there is green at the crown.'
Where no reliable indicator exists, the season alone is enough. Months are
useful alongside an indicator, never instead of one.

## Task file structure

One file per task. Filename mirrors the system tag with hyphens replaced by
underscores, so a tag of leave-stems becomes leave_stems.md. The heading is the
task in plain sentence case and need not match the filename: cutback.md carries
the heading ‘Cut back’.

Task files are written to be transcluded, not read alone, so they start at h4.
The heading levels assume this nesting:

```
h3   season portion, in the plant’s season file
h4   task title, from the pooled task file
h5   tools
```

```
#### Cut back

[What the task is, in one sentence, for a reader who has not met the term.]

[Method. Timing and the natural indicator.]

[Consequence of doing it wrong. Consequence of skipping it.]

[Closing reassurance, stated as fact about the plant.]

##### Tools
- item
- item
```

Omit the tools section entirely when a task needs none; do not write ‘None’.
Roughly 90 words suits a simple task. Pruning, dividing, and containing spread
need more, and should take it.

## Season files

One directory per plant, one file per season portion that has a task. Do not
generate a file for a period with nothing in it. The file carries no plant name:
identity comes from the directory and from the higher-level file that collects
the seasons.

Each task is pulled in as a content block. A note more specific than the pooled
task, whether from the genus or the individual plant, is stated immediately
after the block it refines, labelled with its source:

```
### Mid summer

../../tasks/plant/cutback.md

**Aquilegia canadensis:** Cut old flowering stems to the ground when all
flowering is finished and the stem has dried out.
```

Year-round guidance belonging to no season goes in overview.md, under the
heading ‘Year-round’.
