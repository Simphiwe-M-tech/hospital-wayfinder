import demoHospitalMap from '../data/hospital-map.json' with { type: 'json' }
import { adaptHospitalMap, floorList } from './mapAdapter.js'

// Hospital registry: discovery metadata (name, description, image, stats) lives
// next to the optional navigation loader. Only a hospital whose real graph exists
// exposes loadMap(); activate a new one by adding its JSON and a loader here.
const demo = adaptHospitalMap(demoHospitalMap)

const asset = (file) => `${import.meta.env?.BASE_URL ?? '/'}images/hospitals/${file}`

export const hospitals = [
  {
    id: 'demo-hospital',
    name: 'MSL Demo Hospital',
    badge: 'Demo',
    tagline: 'A two-floor prototype map modelled on our school building.',
    image: null,
    imageAlt: null,
    statsSource: 'map',
    stats: demo.map
      ? {
          floors: floorList(demo.map).length,
          destinations: demo.map.destinations.length,
          checkpoints: demo.map.qrIndex.size,
        }
      : null,
    navigationAvailable: Boolean(demo.map),
    loadMap: () => Promise.resolve(demoHospitalMap),
  },
  {
    id: 'northview-medical-centre',
    name: 'Northview Medical Centre',
    badge: 'Demo / Preview Only',
    tagline: 'Outpatient clinics, imaging and day surgery across five floors.',
    image: asset('northview-medical-centre.jpg'),
    imageAlt: 'Illustrative rendering of a modern medical centre exterior at dusk',
    statsSource: 'preview',
    stats: { floors: 5, destinations: 32, checkpoints: 18 },
    navigationAvailable: false,
    loadMap: null,
  },
  {
    id: 'greenfield-general-hospital',
    name: 'Greenfield General Hospital',
    badge: 'Demo / Preview Only',
    tagline: 'Emergency, maternity and inpatient wards across three floors.',
    image: asset('greenfield-general-hospital.jpg'),
    imageAlt: 'Illustrative rendering of a low-rise general hospital surrounded by lawns',
    statsSource: 'preview',
    stats: { floors: 3, destinations: 21, checkpoints: 12 },
    navigationAvailable: false,
    loadMap: null,
  },
  {
    id: 'riverside-community-hospital',
    name: 'Riverside Community Hospital',
    badge: 'Demo / Preview Only',
    tagline: 'Rehabilitation and community care across four floors by the river.',
    image: asset('riverside-community-hospital.jpg'),
    imageAlt: 'Illustrative rendering of a contemporary community hospital beside a river',
    statsSource: 'preview',
    stats: { floors: 4, destinations: 27, checkpoints: 15 },
    navigationAvailable: false,
    loadMap: null,
  },
]

// The one adapted graph in the registry, used to render a real map preview for
// the single hospital that can actually be navigated.
export const demoMap = demo.map ?? null
