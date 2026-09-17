import demoHospitalMap from '../data/hospital-map.json'
import { adaptHospitalMap, floorList } from './mapAdapter.js'

// Hospital registry. To add a hospital later, append an entry whose loadMap()
// resolves its graph JSON, e.g. () => fetch(`${import.meta.env.BASE_URL}maps/<id>.json`).then((r) => r.json()).
const demo = adaptHospitalMap(demoHospitalMap)

export const hospitals = [
  {
    id: 'demo-hospital',
    name: 'Demo Hospital',
    badge: 'Demo',
    tagline: 'A two-floor prototype map modelled on our school building.',
    stats: demo.map
      ? {
          floors: floorList(demo.map).length,
          destinations: demo.map.destinations.length,
          checkpoints: demo.map.qrIndex.size,
        }
      : null,
    loadMap: () => Promise.resolve(demoHospitalMap),
  },
]
