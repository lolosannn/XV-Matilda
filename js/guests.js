// Lista de grupos familiares invitados.
//
// Cada grupo tiene:
//  - slug: identificador único que va en el link (?g=slug), sin espacios ni tildes.
//  - names: array con los nombres del grupo, en el orden en que se muestran.
//
// El link para cada familia queda: https://tu-dominio/?g=EL_SLUG
//
// Para agregar un grupo nuevo, copiá un bloque y cambiá slug y names.
const GUEST_GROUPS = [
  {
    slug: "ailen-carlos-laura",
    names: ["Ailen", "Carlos", "Laura"],
  },
  {
    slug: "martin-lucas-andrea",
    names: ["Martin", "Lucas", "Andrea"],
  },
];
