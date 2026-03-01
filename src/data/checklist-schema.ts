import type { ChecklistSection, ChecklistItem } from "@/types/inspection";

const makeItem = (
  section: string,
  num: number,
  question: string
): ChecklistItem => ({
  id: `${section.toLowerCase().replace(/[\s/&]+/g, "-")}-${num}`,
  section_name: section,
  item_number: num,
  question_text: question,
  status: "UNKNOWN",
  confidence: 0,
  evidence: [],
  date_corrected: "",
  notes: "",
  last_updated_by: "AGENT",
});

export const createChecklistSchema = (): ChecklistSection[] => [
  {
    name: "Jobsite General",
    items: [
      makeItem("Jobsite General", 1, "Required posters/signs displayed?"),
      makeItem("Jobsite General", 2, "Safety meetings being held and documented?"),
      makeItem("Jobsite General", 3, "First aid kit available and stocked?"),
      makeItem("Jobsite General", 4, "Emergency phone numbers posted?"),
      makeItem("Jobsite General", 5, "Traffic routes established and marked?"),
      makeItem("Jobsite General", 6, "Adequate lighting provided?"),
      makeItem("Jobsite General", 7, "Safety data sheets (SDS) available?"),
      makeItem("Jobsite General", 8, "Accident/incident reports up to date?"),
    ],
  },
  {
    name: "Housekeeping & Sanitation",
    items: [
      makeItem("Housekeeping & Sanitation", 1, "General work area clean and orderly?"),
      makeItem("Housekeeping & Sanitation", 2, "Walkways/aisles clear of obstructions?"),
      makeItem("Housekeeping & Sanitation", 3, "Adequate drinking water provided?"),
      makeItem("Housekeeping & Sanitation", 4, "Toilet facilities available and clean?"),
      makeItem("Housekeeping & Sanitation", 5, "Handwashing facilities available?"),
      makeItem("Housekeeping & Sanitation", 6, "Waste containers provided and used?"),
      makeItem("Housekeeping & Sanitation", 7, "Debris and scrap materials removed regularly?"),
    ],
  },
  {
    name: "Fire Prevention",
    items: [
      makeItem("Fire Prevention", 1, "Adequate number and type of fire extinguisher(s) available?"),
      makeItem("Fire Prevention", 2, "Fire extinguishers inspected and current?"),
      makeItem("Fire Prevention", 3, "Employees trained in fire extinguisher use?"),
      makeItem("Fire Prevention", 4, "No smoking signs posted where required?"),
      makeItem("Fire Prevention", 5, "Flammable/combustible materials stored properly?"),
      makeItem("Fire Prevention", 6, "Hot work permits obtained when required?"),
      makeItem("Fire Prevention", 7, "Fire exits clear and accessible?"),
    ],
  },
  {
    name: "Hazard Communication",
    items: [
      makeItem("Hazard Communication", 1, "Written hazard communication program available?"),
      makeItem("Hazard Communication", 2, "Containers properly labeled?"),
      makeItem("Hazard Communication", 3, "Employees trained on hazardous chemicals?"),
      makeItem("Hazard Communication", 4, "SDS readily accessible for all chemicals?"),
    ],
  },
  {
    name: "Electrical",
    items: [
      makeItem("Electrical", 1, "GFCI protection on all temporary circuits?"),
      makeItem("Electrical", 2, "Temporary wiring properly installed?"),
      makeItem("Electrical", 3, "Electrical panels accessible (36\" clearance)?"),
      makeItem("Electrical", 4, "Extension cords in good condition?"),
      makeItem("Electrical", 5, "No use of damaged electrical equipment?"),
    ],
  },
  {
    name: "Personal Protective Equipment",
    items: [
      makeItem("Personal Protective Equipment", 1, "Hard hats worn where required?"),
      makeItem("Personal Protective Equipment", 2, "Safety glasses/goggles worn where required?"),
      makeItem("Personal Protective Equipment", 3, "Hearing protection provided/used in high noise areas?"),
      makeItem("Personal Protective Equipment", 4, "Proper footwear worn?"),
      makeItem("Personal Protective Equipment", 5, "High-visibility vests worn where required?"),
      makeItem("Personal Protective Equipment", 6, "Gloves appropriate for task being worn?"),
    ],
  },
  {
    name: "Tools & Equipment",
    items: [
      makeItem("Tools & Equipment", 1, "Power tools properly guarded?"),
      makeItem("Tools & Equipment", 2, "Hand tools in safe condition?"),
      makeItem("Tools & Equipment", 3, "Powder-actuated tools used only by trained operators?"),
      makeItem("Tools & Equipment", 4, "Tools stored properly when not in use?"),
    ],
  },
  {
    name: "Ladders",
    items: [
      makeItem("Ladders", 1, "Ladders in good condition (no damage)?"),
      makeItem("Ladders", 2, "Ladders set up at proper angle?"),
      makeItem("Ladders", 3, "Ladders extend 3 feet above landing?"),
      makeItem("Ladders", 4, "Ladders secured at top or base?"),
    ],
  },
  {
    name: "Scaffolding",
    items: [
      makeItem("Scaffolding", 1, "Scaffolds erected by competent person?"),
      makeItem("Scaffolding", 2, "Guardrails, midrails, and toeboards in place?"),
      makeItem("Scaffolding", 3, "Scaffold planking in good condition?"),
      makeItem("Scaffolding", 4, "Access ladders provided?"),
      makeItem("Scaffolding", 5, "Scaffold tags current?"),
    ],
  },
  {
    name: "Excavation",
    items: [
      makeItem("Excavation", 1, "Excavation inspected by competent person?"),
      makeItem("Excavation", 2, "Utilities located and marked before digging?"),
      makeItem("Excavation", 3, "Proper sloping/shoring/shielding in place?"),
      makeItem("Excavation", 4, "Spoil pile set back 2 feet from edge?"),
      makeItem("Excavation", 5, "Means of egress provided (ladders within 25 ft)?"),
    ],
  },
  {
    name: "Heavy Equipment",
    items: [
      makeItem("Heavy Equipment", 1, "Equipment operators trained and certified?"),
      makeItem("Heavy Equipment", 2, "Equipment inspected daily?"),
      makeItem("Heavy Equipment", 3, "Backup alarms functioning?"),
      makeItem("Heavy Equipment", 4, "Seat belts worn?"),
      makeItem("Heavy Equipment", 5, "Barricades around swing radius?"),
    ],
  },
  {
    name: "Motor Vehicles",
    items: [
      makeItem("Motor Vehicles", 1, "Vehicles inspected and maintained?"),
      makeItem("Motor Vehicles", 2, "Seat belts used?"),
      makeItem("Motor Vehicles", 3, "Speed limits posted and observed?"),
      makeItem("Motor Vehicles", 4, "Designated parking areas established?"),
    ],
  },
];
