// Lista de grupos familiares/individuales invitados.
//
// Cada grupo tiene:
//  - slug: identificador único que va en el link (?g=slug), sin espacios ni tildes.
//  - names: array con los nombres del grupo, en el orden en que se muestran.
//
// El link para cada familia/persona queda: https://tu-dominio/?g=EL_SLUG
//
// Para agregar un grupo nuevo, copiá un bloque y cambiá slug y names.
//
// Notas sobre esta carga inicial (desde INVITACIONES_MATILDA.xlsx):
//  - "more", "ali", "lo", "sofi", "lua", "amb" quedaron cargados como apodos
//    temporales (así estaban en el excel); falta reemplazarlos por los nombres
//    completos reales.
//  - "ciro" / "ciro-2" y "ori" / "ori-2" son personas distintas con el mismo
//    nombre de pila (confirmado). Si hace falta diferenciarlos más en la
//    pantalla, se puede agregar apellido o inicial en "names".
//  - "ambar-giuli" (grupo) y "ambar" (individual) son personas distintas
//    (confirmado), no un duplicado.
const GUEST_GROUPS = [
  { slug: "mariela-juanjo-ignacio", names: ["Mariela", "Juanjo", "Ignacio"] },
  { slug: "elisa-jorge", names: ["Elisa", "Jorge"] },
  { slug: "stella-quique", names: ["Stella", "Quique"] },
  { slug: "fefa-ricardo", names: ["Fefa", "Ricardo"] },
  { slug: "eugenia-juanse-lila-marcos", names: ["Eugenia", "Juanse", "Lila", "Marcos"] },
  { slug: "anita-norma-aida", names: ["Anita", "Norma", "Aida"] },
  { slug: "osvaldo", names: ["Osvaldo"] },
  { slug: "roxana", names: ["Roxana"] },
  { slug: "marisa", names: ["Marisa"] },
  { slug: "gabriel-laura-ignacio", names: ["Gabriel", "Laura", "Ignacio"] },
  { slug: "carlos-laura-ailen", names: ["Carlos", "Laura", "Ailen"] },
  { slug: "bernardo-analia-guillermina-martina-tomas", names: ["Bernardo", "Analia", "Guillermina", "Martina", "Tomas"] },
  { slug: "david-eugenia-tomas", names: ["David", "Eugenia", "Tomas"] },
  { slug: "carolina-ruben-facundo-gonzalo", names: ["Carolina", "Ruben", "Facundo", "Gonzalo"] },
  { slug: "natalia-isabel", names: ["Natalia", "Isabel"] },
  { slug: "chuchi-matilde", names: ["Chuchi", "Matilde"] },
  { slug: "norma-raul", names: ["Norma", "Raul"] },
  { slug: "paula", names: ["Paula"] },
  { slug: "leandro", names: ["Leandro"] },
  { slug: "morena", names: ["Morena"] },
  { slug: "jose-rosa", names: ["Jose", "Rosa"] },
  { slug: "nicolas-sofia", names: ["Nicolas", "Sofia"] },
  { slug: "anabel-sebastian-bianca-lara-norma", names: ["Anabel", "Sebastian", "Bianca", "Lara", "Norma"] },
  { slug: "analia", names: ["Analia"] },
  { slug: "cinthia", names: ["Cinthia"] },
  { slug: "romina", names: ["Romina"] },
  { slug: "more", names: ["More"] },
  { slug: "ali", names: ["Ali"] },
  { slug: "lo", names: ["Lo"] },
  { slug: "sofi", names: ["Sofi"] },
  { slug: "lua", names: ["Lua"] },
  { slug: "amb", names: ["Amb"] },
  { slug: "ambar-giuli", names: ["Ambar", "Giuli"] },
  { slug: "anto", names: ["Anto"] },
  { slug: "barby", names: ["Barby"] },
  { slug: "emi", names: ["Emi"] },
  { slug: "aitu", names: ["Aitu"] },
  { slug: "pili", names: ["Pili"] },
  { slug: "isa", names: ["Isa"] },
  { slug: "cata", names: ["Cata"] },
  { slug: "agus", names: ["Agus"] },
  { slug: "luz", names: ["Luz"] },
  { slug: "malen", names: ["Malen"] },
  { slug: "matil", names: ["Matil"] },
  { slug: "almivalen", names: ["Almivalen"] },
  { slug: "alma", names: ["Alma"] },
  { slug: "sele", names: ["Sele"] },
  { slug: "vicky", names: ["Vicky"] },
  { slug: "ambar", names: ["Ambar"] },
  { slug: "mori", names: ["Mori"] },
  { slug: "loli", names: ["Loli"] },
  { slug: "maxi", names: ["Maxi"] },
  { slug: "ciro", names: ["Ciro"] },
  { slug: "piero", names: ["Piero"] },
  { slug: "pedro", names: ["Pedro"] },
  { slug: "facu", names: ["Facu"] },
  { slug: "guido", names: ["Guido"] },
  { slug: "juani", names: ["Juani"] },
  { slug: "ciro-2", names: ["Ciro"] },
  { slug: "renzo", names: ["Renzo"] },
  { slug: "dante", names: ["Dante"] },
  { slug: "almu", names: ["Almu"] },
  { slug: "martu", names: ["Martu"] },
  { slug: "lai", names: ["Lai"] },
  { slug: "ori", names: ["Ori"] },
  { slug: "bian", names: ["Bian"] },
  { slug: "oliver", names: ["Oliver"] },
  { slug: "romi", names: ["Romi"] },
  { slug: "ori-2", names: ["Ori"] },
  { slug: "juli", names: ["Juli"] },
  { slug: "iara", names: ["Iara"] },
  { slug: "santi", names: ["Santi"] },
];
