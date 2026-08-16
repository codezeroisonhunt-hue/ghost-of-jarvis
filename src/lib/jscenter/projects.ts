import { ScienceProject, Difficulty, ProjectType } from "./types";

/**
 * Structured project knowledge base. Kept fully separate from the UI so new
 * projects / subjects can be appended without touching components.
 *
 * Line format:
 *  Title | difficulty(B|I|A|C) | minClass-maxClass | costMin-costMax | innovation | type(P|S|H) | competition | days | tags,comma,separated
 */

const DIFF: Record<string, Difficulty> = { B: "Beginner", I: "Intermediate", A: "Advanced", C: "Competition Advanced" };
const TYPE: Record<string, ProjectType> = { P: "Physical", S: "Software", H: "Hybrid" };

interface Block { subject: string; category: string; lines: string }

const BLOCKS: Block[] = [
  {
    subject: "Physics", category: "Physics",
    lines: `
Smart Traffic Collision Prevention Model | A | 9-12 | 2000-4000 | 88 | H | District | 14 | traffic,ultrasonic,arduino,safety
Electromagnetic Crane with Load Sensing | I | 8-12 | 800-1800 | 72 | P | School | 7 | electromagnetism,coil,motor
Wireless Power Transfer over Air Gap | A | 10-12 | 900-2200 | 86 | P | District | 10 | induction,resonance,coil
Magnetic Levitation Train Track Model | A | 9-12 | 1500-3500 | 90 | P | State | 15 | maglev,magnets,transport
Dual-Axis Automatic Solar Tracker | I | 9-12 | 1500-3000 | 80 | P | District | 10 | solar,ldr,servo
Solar Powered Model Vehicle with MPPT Demo | I | 8-12 | 1200-2800 | 74 | P | School | 8 | solar,energy,motor
Regenerative Braking Energy Recovery Model | A | 10-12 | 1500-3200 | 87 | P | State | 12 | energy,braking,dynamo
Hydraulic Lift using Syringe Mechanics | B | 5-9 | 200-600 | 55 | P | School | 4 | pascal,hydraulics
Pneumatic Robotic Arm | I | 8-12 | 600-1500 | 70 | P | School | 7 | pneumatics,pressure,arm
Smart Adaptive Suspension Test Rig | A | 10-12 | 2000-4500 | 85 | H | State | 16 | damping,accelerometer
Seismic Vibration Detector with Data Log | I | 8-12 | 900-2000 | 78 | H | District | 9 | earthquake,vibration,sensor
Earthquake Resistant Building Shake Table | I | 6-12 | 500-1500 | 76 | P | District | 8 | structure,damping,civil
Wind Turbine Blade Angle Optimisation Study | I | 8-12 | 700-1800 | 79 | P | District | 9 | wind,energy,aerodynamics
Wave Energy Oscillating Column Generator | A | 9-12 | 1500-3500 | 88 | P | State | 14 | ocean,energy,renewable
Mini Hydroelectric Generator with Head Study | I | 7-12 | 800-2000 | 72 | P | School | 8 | hydro,turbine,energy
Wireless Charging Pad for Small Devices | I | 9-12 | 700-1600 | 74 | P | District | 8 | induction,coil
Laser Optical Voice Communication Link | A | 9-12 | 800-2000 | 89 | P | State | 10 | laser,optics,communication
Laser Tripwire Security System | B | 6-10 | 400-1000 | 60 | P | School | 4 | laser,ldr,security
Automatic Street Light with Traffic Dimming | B | 6-11 | 400-1200 | 62 | P | School | 5 | ldr,energy,automation
Smart Energy Meter with Live Consumption Graph | A | 10-12 | 1500-3000 | 84 | H | District | 12 | energy,current sensor,iot
Waste Heat Recovery Demonstration Unit | A | 10-12 | 1200-3000 | 83 | P | State | 12 | thermodynamics,peltier
Thermoelectric Generator from Stove Heat | I | 9-12 | 800-2000 | 80 | P | District | 8 | peltier,seebeck,energy
Electromagnetic Launcher (Low Voltage, Safe) Demo | A | 10-12 | 1200-2800 | 82 | P | District | 10 | electromagnetism,coilgun,safe
Gyroscope Self-Balancing Platform | C | 10-12 | 2500-5000 | 92 | H | State | 18 | mpu6050,pid,stability
Ultrasonic Anti-Collision Vehicle | I | 7-12 | 1200-2500 | 75 | P | School | 7 | ultrasonic,arduino,safety
Automatic Emergency Braking Test Track | A | 10-12 | 2000-4000 | 86 | H | State | 14 | braking,sensor,safety
Doppler Effect Demonstration Apparatus | I | 9-12 | 600-1500 | 76 | P | District | 7 | sound,doppler,waves
Standing Wave Ruben's Tube (Safe LED Version) | I | 9-12 | 800-1800 | 81 | P | District | 8 | waves,resonance,safe
Photoelectric Effect Demonstration Kit | A | 11-12 | 1500-3500 | 85 | P | State | 12 | quantum,ldr,light
Measuring Planck Constant with LEDs | C | 11-12 | 800-2000 | 93 | P | National | 12 | quantum,led,experiment
Speed of Sound Measurement using Resonance Tube | I | 9-12 | 400-1000 | 70 | P | School | 5 | sound,resonance
Bernoulli Principle Lift Test Wing | I | 8-12 | 500-1200 | 68 | P | School | 6 | fluids,aerodynamics
Surface Tension and Capillary Rise Study | B | 6-10 | 200-600 | 58 | P | School | 4 | fluids,liquids
Solar Water Heater Efficiency Comparison | I | 8-12 | 900-2200 | 73 | P | District | 9 | solar,heat,energy
Parabolic Solar Cooker Efficiency Study | I | 8-12 | 800-2000 | 75 | P | District | 8 | solar,heat,cooking
Infrared Remote Signal Decoder Display | I | 9-12 | 600-1400 | 71 | H | School | 6 | ir,electronics
Faraday Cage Signal Blocking Experiment | I | 8-12 | 300-900 | 74 | P | District | 5 | em waves,shielding
Electromagnetic Induction Bicycle Dynamo Study | I | 8-12 | 500-1200 | 69 | P | School | 6 | induction,dynamo
Piezoelectric Footstep Power Tile | A | 9-12 | 1200-3000 | 87 | P | State | 12 | piezo,energy harvesting
Kinetic Speed Breaker Power Generator | A | 9-12 | 1800-4000 | 85 | P | State | 14 | mechanical,energy
Automatic Railway Gate Control Model | I | 7-12 | 1200-2600 | 74 | P | District | 9 | ir sensor,railway,safety
Smart Water Level Controller for Overhead Tank | B | 7-12 | 500-1200 | 64 | P | School | 5 | water,float sensor
Optical Fibre Light Guiding Demonstration | I | 8-12 | 400-1200 | 72 | P | School | 6 | optics,fibre
Lens Focal Length Robotic Auto-Focus Rig | A | 10-12 | 1500-3500 | 84 | H | State | 12 | optics,servo,vision
Colour Temperature and Plant Light Study | I | 8-12 | 800-1800 | 78 | H | District | 10 | light,biology,leds
Sound Absorption of Building Materials Study | I | 8-12 | 400-1200 | 72 | P | District | 7 | acoustics,materials
Model Rocket Water Launcher Trajectory Study | I | 7-12 | 400-1200 | 76 | P | District | 7 | projectile,physics,safe
Non-Contact Tachometer with IR Sensor | I | 9-12 | 600-1500 | 73 | H | School | 6 | rotation,ir,measurement
Smart Helmet Impact Alert System | A | 9-12 | 2000-4000 | 88 | H | State | 12 | accelerometer,safety,gsm
Automatic Fan Speed by Temperature and Humidity | B | 7-11 | 600-1400 | 65 | P | School | 5 | dht11,automation
`,
  },
  {
    subject: "Chemistry", category: "Chemistry",
    lines: `
Water Quality Monitoring Station (TDS + pH + Turbidity) | A | 9-12 | 1800-3800 | 87 | H | State | 12 | water,sensors,iot
Natural pH Indicators from Local Flowers | B | 5-10 | 100-400 | 60 | P | School | 4 | indicator,acid base
Electrochemical Cell Voltage Comparison Study | I | 9-12 | 300-900 | 72 | P | District | 6 | electrochemistry,cells
Fruit Battery Optimisation Experiment | B | 5-9 | 150-500 | 58 | P | School | 4 | battery,electrolyte
Corrosion Rate Under Different Coatings | I | 8-12 | 300-800 | 74 | P | District | 10 | corrosion,materials
Green Chemistry Soap from Waste Cooking Oil | I | 8-12 | 300-900 | 76 | P | District | 6 | green chemistry,saponification
Bioplastic from Corn and Potato Starch | I | 7-12 | 200-700 | 82 | P | District | 6 | bioplastic,polymer
Natural Dye Extraction and Fastness Test | B | 6-11 | 200-600 | 66 | P | School | 5 | dye,extraction
Water Hardness Detection and Softening Study | I | 8-12 | 300-900 | 70 | P | School | 6 | hardness,titration
Electrolysis of Water Efficiency Study | I | 8-12 | 400-1200 | 75 | P | District | 6 | electrolysis,hydrogen
Safe Hydrogen Generation Demonstration Cell | A | 10-12 | 800-2000 | 84 | P | State | 9 | hydrogen,energy,safe
Activated Carbon Water Filtration Efficiency | I | 7-12 | 300-900 | 73 | P | District | 6 | filtration,carbon
Low-Cost Wastewater Treatment Model | A | 9-12 | 900-2200 | 85 | P | State | 11 | water,treatment,environment
Oil Water Separation using Natural Sorbents | I | 8-12 | 300-900 | 80 | P | District | 6 | oil spill,sorbent
Chemical Energy Storage in Salt Hydrates | A | 10-12 | 800-2000 | 83 | P | State | 10 | thermal storage,chemistry
Soil Chemistry NPK Analysis Kit | A | 9-12 | 1200-2800 | 84 | H | State | 10 | soil,agriculture,sensor
Smart Fertiliser Dosing Monitor | A | 10-12 | 1500-3200 | 86 | H | State | 12 | agriculture,sensor,iot
Rate of Reaction vs Temperature Study | B | 8-12 | 150-500 | 62 | P | School | 4 | kinetics,experiment
Catalyst Efficiency Comparison (Safe Reactions) | I | 9-12 | 300-900 | 74 | P | District | 6 | catalyst,kinetics
Biodegradability Test of Common Plastics | I | 7-12 | 200-700 | 78 | P | District | 20 | plastic,environment
Milk Adulteration Detection Kit | I | 8-12 | 300-900 | 82 | P | District | 6 | food safety,testing
Food Colour Adulteration Chromatography Study | I | 8-12 | 200-700 | 77 | P | District | 5 | chromatography,food
Vitamin C Content in Fruit Juices | B | 7-12 | 200-600 | 65 | P | School | 5 | titration,nutrition
Rust Prevention using Sacrificial Anodes | I | 9-12 | 300-900 | 73 | P | District | 8 | corrosion,electrochemistry
Desalination by Solar Distillation | I | 8-12 | 500-1500 | 81 | P | District | 8 | water,solar
Eco-Friendly Mosquito Repellent from Plant Oils | I | 6-11 | 200-600 | 72 | P | School | 6 | extraction,health
Biogas Production from Kitchen Waste Model | A | 9-12 | 900-2200 | 84 | P | State | 14 | biogas,energy,waste
Detecting Microplastics in Local Water Samples | A | 9-12 | 600-1600 | 88 | P | State | 10 | microplastic,environment
Natural Preservative Efficiency Study | I | 7-12 | 200-700 | 71 | P | School | 10 | food,preservation
Smart Gas Leak Detection and Cut-off Model | A | 9-12 | 1500-3200 | 85 | H | State | 10 | mq2,safety,iot
`,
  },
  {
    subject: "Biology", category: "Biology",
    lines: `
AI Plant Disease Detection from Leaf Images | C | 10-12 | 2500-5000 | 94 | H | National | 18 | ai,vision,agriculture
Soil Moisture Based Smart Irrigation Model | I | 7-12 | 1000-2200 | 78 | H | District | 8 | irrigation,sensor
Plant Growth Under Different Light Spectra | I | 6-12 | 500-1500 | 76 | P | District | 21 | plants,light,experiment
Automated Greenhouse with Climate Control | A | 9-12 | 2500-5000 | 88 | H | State | 16 | greenhouse,iot,sensors
Soil Health Monitoring Station | A | 9-12 | 1500-3200 | 85 | H | State | 12 | soil,sensor,agriculture
Seed Germination Rate vs Water Quality | B | 4-10 | 150-500 | 62 | P | School | 12 | germination,experiment
Photosynthesis Rate vs Light Intensity | I | 8-12 | 300-900 | 72 | P | District | 8 | photosynthesis,experiment
Transpiration Rate in Different Plant Species | I | 7-12 | 200-700 | 70 | P | School | 8 | transpiration,plants
Biodiversity Survey of a School Campus | I | 6-12 | 200-800 | 75 | H | District | 14 | biodiversity,survey
Smart Composting Bin with Temperature Logging | I | 8-12 | 900-2200 | 82 | H | District | 14 | compost,sensor,waste
Microorganism Growth on Different Surfaces | I | 8-12 | 300-900 | 74 | P | District | 10 | microbiology,hygiene
Natural Food Preservation Shelf-Life Study | B | 6-11 | 200-700 | 66 | P | School | 12 | food,preservation
Pollinator Activity Monitoring with Time-Lapse | A | 8-12 | 1200-2800 | 86 | H | State | 14 | pollination,camera,ecology
Low-Cost Hydroponics Nutrient Comparison | I | 8-12 | 900-2200 | 83 | P | District | 21 | hydroponics,agriculture
Aquaponics Fish and Plant Balance Model | A | 9-12 | 2000-4500 | 89 | P | State | 21 | aquaponics,ecosystem
Heart Rate Response to Exercise Study | B | 6-12 | 300-900 | 64 | H | School | 5 | human body,health
Lung Capacity Measurement Model | B | 6-11 | 200-700 | 63 | P | School | 5 | respiration,human body
Bacterial Growth Inhibition by Natural Extracts | A | 9-12 | 500-1500 | 84 | P | State | 12 | microbiology,antibacterial
Vertical Farming Tower Yield Study | A | 9-12 | 1800-4000 | 87 | P | State | 21 | farming,space efficiency
DNA Extraction from Fruits (Simple Method) | I | 8-12 | 200-600 | 76 | P | District | 4 | genetics,biotech
Effect of Music/Vibration on Plant Growth | I | 5-10 | 300-900 | 68 | P | School | 21 | plants,experiment
Mushroom Cultivation Yield Optimisation | I | 8-12 | 700-1800 | 80 | P | District | 21 | fungi,agriculture
Water Purification using Moringa Seeds | I | 7-12 | 200-700 | 82 | P | District | 6 | biofilter,water
Insect Population Bio-Indicator Study | I | 8-12 | 200-800 | 78 | P | District | 14 | ecology,indicator
Smart Poultry / Livestock Shed Monitor | A | 9-12 | 1800-4000 | 84 | H | State | 12 | iot,livestock,sensor
Wearable Fall Detection for Elderly (Prototype) | A | 10-12 | 1800-4000 | 88 | H | State | 12 | accelerometer,health,prototype
Air Purifying Ability of Indoor Plants | I | 7-12 | 800-2000 | 79 | H | District | 14 | air quality,plants
`,
  },
  {
    subject: "Environmental Science", category: "Environment",
    lines: `
AI Waste Segregation Bin (Dry / Wet / Metal) | C | 9-12 | 2500-5000 | 93 | H | National | 18 | ai,vision,waste
Smart Garbage Bin with Fill-Level Alert | I | 7-12 | 1200-2600 | 78 | H | District | 8 | ultrasonic,iot,waste
Low-Cost Air Quality Monitor (PM2.5 + Gas) | A | 9-12 | 1800-3800 | 88 | H | State | 12 | air quality,sensor,iot
Water Pollution Detector for Local Lakes | A | 9-12 | 1500-3200 | 86 | H | State | 12 | water,sensor,pollution
River Flood Early Warning Model | A | 9-12 | 1800-4000 | 90 | H | State | 14 | flood,sensor,alert
Drought Prediction from Weather Data | A | 10-12 | 800-2500 | 85 | H | State | 12 | data,prediction,climate
Rainwater Harvesting Efficiency Model | I | 6-12 | 700-1800 | 76 | P | District | 8 | water,conservation
Solar Desalination Still with Yield Study | I | 8-12 | 700-1800 | 83 | P | District | 9 | solar,water
Smart Recycling Reward Machine Model | A | 9-12 | 2000-4500 | 87 | H | State | 15 | recycling,sensor,incentive
Carbon Footprint Calculator for Schools | I | 8-12 | 0-500 | 74 | S | District | 6 | data,climate,software
Forest Fire Early Warning Node | A | 9-12 | 1800-4000 | 91 | H | State | 14 | fire,sensor,alert
Multi-Sensor Environment Monitoring Station | A | 9-12 | 2500-5000 | 88 | H | State | 16 | iot,weather,sensors
Noise Pollution Mapping of a Locality | I | 8-12 | 600-1600 | 79 | H | District | 8 | noise,mapping,sensor
Plastic Pollution Audit and Reduction Plan | B | 6-12 | 100-500 | 70 | P | School | 10 | survey,plastic
Urban Heat Island Temperature Mapping | A | 9-12 | 800-2200 | 86 | H | State | 12 | climate,mapping
Greywater Recycling Model for Homes | I | 8-12 | 900-2200 | 82 | P | District | 10 | water,reuse
Eco-Brick Construction Strength Test | I | 7-12 | 300-900 | 78 | P | District | 8 | recycling,civil
Solar Powered Water Aerator for Ponds | A | 9-12 | 1500-3200 | 84 | P | State | 10 | solar,aquatic,oxygen
Landslide Risk Monitoring with Tilt and Moisture | C | 10-12 | 2000-4500 | 92 | H | National | 16 | landslide,sensor,ai
Smart Rainfall Measurement and Alert Gauge | I | 7-12 | 800-2000 | 76 | H | District | 8 | rain gauge,iot
`,
  },
  {
    subject: "Artificial Intelligence", category: "AI / Machine Learning",
    lines: `
VisionGuard AI — Disaster Early Warning and Rescue System | C | 10-12 | 2500-5000 | 96 | H | National | 20 | ai,disaster,sensors,featured
AI Crop Disease Detection Field Station | C | 10-12 | 2500-5000 | 93 | H | National | 18 | ai,agriculture,vision
AI Waste Classification Camera Module | A | 9-12 | 2000-4500 | 90 | H | State | 14 | ai,vision,waste
AI Traffic Density Monitoring and Signal Timing | C | 10-12 | 2500-5000 | 94 | H | National | 18 | ai,traffic,vision
AI Fire and Smoke Detection Node | A | 9-12 | 2000-4000 | 91 | H | State | 14 | ai,fire,safety
AI Flood Risk Prediction from Sensor History | A | 10-12 | 1500-3500 | 90 | H | State | 14 | ai,flood,data
AI Sign Language Recognition Trainer | C | 10-12 | 1500-3500 | 92 | H | National | 16 | ai,vision,accessibility
AI Sound Classification for Machine Faults | A | 10-12 | 1200-3000 | 89 | H | State | 14 | ai,audio,maintenance
AI Object Sorting Conveyor Model | A | 9-12 | 2500-5000 | 90 | H | State | 16 | ai,vision,robotics
AI Plant Growth Prediction Dashboard | A | 10-12 | 1200-3000 | 85 | H | State | 14 | ai,data,agriculture
AI Air Quality Forecasting Model | A | 10-12 | 1000-2500 | 87 | H | State | 12 | ai,air,data
AI Energy Consumption Prediction for Homes | A | 10-12 | 1200-3000 | 86 | H | State | 12 | ai,energy,data
AI Water Quality Prediction from Sensor Data | A | 10-12 | 1500-3500 | 87 | H | State | 12 | ai,water,data
AI Accident Risk Prediction for Road Segments | A | 10-12 | 500-2000 | 88 | H | State | 12 | ai,safety,data
AI Structural Crack Detection from Photos | C | 10-12 | 1500-3500 | 92 | H | National | 14 | ai,vision,civil
AI Recyclable Material Recognition Assistant | A | 9-12 | 1800-4000 | 88 | H | State | 14 | ai,vision,recycling
AI Handwriting Digit Recognition Exhibit | I | 8-12 | 0-800 | 76 | S | District | 6 | ai,mnist,basics
AI Chatbot Study Assistant for a Subject | I | 8-12 | 0-500 | 78 | S | District | 7 | ai,nlp,education
AI Weather Nowcasting from Local Sensors | A | 10-12 | 1500-3500 | 88 | H | State | 14 | ai,weather,sensors
AI Rainfall Pattern Clustering Study | A | 11-12 | 0-800 | 84 | S | State | 10 | ai,statistics,climate
AI Speech-to-Text Classroom Note Taker | A | 10-12 | 0-1000 | 83 | S | State | 10 | ai,audio,education
AI Colour Blindness Assistive Camera | A | 10-12 | 1500-3500 | 89 | H | State | 12 | ai,vision,accessibility
AI Posture Correction Alert Device | A | 10-12 | 1500-3500 | 87 | H | State | 12 | ai,health,sensor
AI Ripeness Detection for Fruits | A | 9-12 | 1500-3500 | 88 | H | State | 12 | ai,vision,agriculture
AI Anomaly Detection for Water Pipeline Leaks | C | 11-12 | 2000-4500 | 91 | H | National | 16 | ai,sensor,infrastructure
`,
  },
  {
    subject: "Robotics", category: "Robotics",
    lines: `
Line Following Rescue Robot | I | 7-12 | 1200-2800 | 78 | P | District | 10 | robot,ir sensor,rescue
Autonomous Firefighting Robot | A | 9-12 | 2500-5000 | 90 | H | State | 16 | robot,flame sensor,pump
Agricultural Seed Sowing Robot | A | 9-12 | 2500-5000 | 89 | P | State | 16 | robot,agriculture
Waste Collection Robot for Campus | A | 9-12 | 2500-5000 | 88 | H | State | 16 | robot,waste
Obstacle Avoidance Autonomous Rover | I | 7-12 | 1500-3000 | 76 | P | District | 10 | robot,ultrasonic
Voice Controlled Wheelchair Concept Model | A | 10-12 | 2500-5000 | 90 | H | State | 16 | robot,accessibility,voice
Search and Rescue Robot with Camera Feed | C | 10-12 | 3000-6000 | 93 | H | National | 20 | robot,camera,rescue
Hospital Medicine Delivery Robot | A | 9-12 | 2500-5000 | 87 | H | State | 16 | robot,delivery,health
Warehouse Sorting Robot Arm | A | 10-12 | 2500-5000 | 88 | H | State | 16 | robot,arm,automation
Autonomous Delivery Bot with GPS Waypoints | C | 10-12 | 3000-6000 | 91 | H | National | 20 | robot,gps,navigation
Solar Panel Cleaning Robot | A | 9-12 | 2000-4500 | 89 | P | State | 14 | robot,solar,maintenance
Water Quality Monitoring Boat Robot | C | 10-12 | 3000-6000 | 92 | H | National | 18 | robot,water,sensor
Gesture Controlled Robotic Arm | A | 9-12 | 2000-4500 | 86 | H | State | 14 | robot,mpu6050,gesture
Pipe Inspection Crawler Robot | C | 10-12 | 2500-5000 | 90 | H | National | 18 | robot,inspection
Bluetooth Controlled Multi-Terrain Rover | B | 7-11 | 1200-2500 | 70 | P | School | 8 | robot,bluetooth
Self-Balancing Two Wheel Robot | C | 10-12 | 2500-5000 | 92 | H | National | 18 | robot,pid,mpu6050
Robotic Fish for Aquatic Monitoring | C | 10-12 | 2500-5000 | 93 | P | National | 20 | robot,biomimicry
Wall Climbing Suction Robot Model | C | 10-12 | 2500-5000 | 91 | P | National | 18 | robot,suction
Maze Solving Micromouse Robot | A | 9-12 | 1800-4000 | 88 | H | State | 14 | robot,algorithm
Robotic Braille Reader Concept | C | 10-12 | 2500-5000 | 92 | H | National | 18 | robot,accessibility
`,
  },
  {
    subject: "IoT", category: "IoT",
    lines: `
Smart Home Automation Board with App Control | I | 8-12 | 2000-4000 | 80 | H | District | 12 | iot,esp32,home
Smart Agriculture Field Node with Cloud Logging | A | 9-12 | 2000-4500 | 88 | H | State | 14 | iot,agriculture,cloud
Smart Classroom Attendance and Comfort Monitor | A | 9-12 | 1800-4000 | 84 | H | State | 12 | iot,school,sensor
Smart Hospital Patient Vitals Monitor (Prototype) | A | 10-12 | 2000-4500 | 87 | H | State | 14 | iot,health,prototype
Smart Parking Slot Detection System | I | 8-12 | 1500-3200 | 82 | H | District | 10 | iot,ir sensor,parking
Weather-Linked Smart Irrigation Controller | A | 9-12 | 1800-4000 | 86 | H | State | 12 | iot,weather api,agriculture
Smart Energy Management Load Scheduler | A | 10-12 | 1500-3500 | 85 | H | State | 12 | iot,energy
Smart Water Tank with Leak Detection | I | 8-12 | 1200-2800 | 79 | H | District | 10 | iot,water,sensor
Smart Greenhouse with Remote Dashboard | A | 9-12 | 2500-5000 | 88 | H | State | 16 | iot,greenhouse
Personal Weather Station with Web Dashboard | I | 8-12 | 1500-3200 | 81 | H | District | 10 | iot,weather
Roadside Pollution Monitoring Node | A | 9-12 | 1800-4000 | 86 | H | State | 12 | iot,pollution
Smart Door Lock with OTP (No Biometrics) | A | 9-12 | 1800-4000 | 84 | H | State | 12 | iot,security,otp
Cold Chain Temperature Logger for Vaccines | A | 10-12 | 1500-3500 | 89 | H | State | 12 | iot,health,logging
Smart Bus Arrival Display for Stops | A | 9-12 | 1800-4000 | 85 | H | State | 12 | iot,transport
Flood Sensor Mesh for a Village Model | C | 10-12 | 2500-5000 | 91 | H | National | 16 | iot,flood,mesh
`,
  },
  {
    subject: "Astronomy", category: "Astronomy",
    lines: `
Scaled Solar System Model with Orbital Periods | B | 4-10 | 400-1200 | 62 | P | School | 6 | space,scale model
Planetary Motion Simulator (Kepler Laws) | I | 8-12 | 600-1600 | 78 | H | District | 8 | space,kepler
Solar and Lunar Eclipse Simulator | B | 5-10 | 300-900 | 66 | P | School | 5 | eclipse,light
Moon Phase Demonstration Model | B | 3-8 | 200-700 | 58 | P | School | 4 | moon,phases
Gravity Well Spacetime Demonstration | I | 8-12 | 400-1200 | 80 | P | District | 6 | gravity,relativity
Exoplanet Transit Detection with LDR | C | 10-12 | 800-2200 | 92 | H | National | 12 | space,photometry
Star Classification from Spectra Data | A | 10-12 | 0-800 | 86 | S | State | 10 | astronomy,data
Light Pollution Measurement across a City | A | 9-12 | 600-1600 | 85 | H | State | 10 | light pollution,sensor
Motorised Telescope Tracking Mount | C | 10-12 | 2500-5000 | 91 | P | National | 18 | telescope,tracking
Satellite Communication Link Model | A | 9-12 | 1200-3000 | 84 | P | State | 12 | satellite,rf
Sundial and Solar Time Calculation Study | B | 4-9 | 100-400 | 60 | P | School | 4 | sun,time
Meteorite Impact Crater Formation Study | I | 6-11 | 200-700 | 72 | P | School | 5 | impact,geology
Radio Signal Reception from Space (Basic) | C | 11-12 | 2000-4500 | 90 | P | National | 16 | radio,astronomy
Rocket Stability and Fin Design Study | I | 8-12 | 500-1500 | 79 | P | District | 8 | rocket,aerodynamics
Mars Habitat Life Support Concept Model | A | 9-12 | 1800-4000 | 88 | P | State | 14 | space,habitat
`,
  },
  {
    subject: "Mathematics", category: "Mathematics",
    lines: `
Traffic Signal Timing Optimisation Model | A | 10-12 | 300-1200 | 85 | H | State | 10 | optimisation,traffic
Monte Carlo Probability Simulation Board | I | 8-12 | 200-800 | 76 | H | District | 6 | probability,simulation
Fractal Geometry Construction Models | I | 7-12 | 200-700 | 78 | P | District | 6 | fractals,geometry
Fibonacci Patterns in Nature Field Study | B | 5-10 | 100-500 | 66 | P | School | 6 | fibonacci,nature
Cryptography: From Caesar to RSA Demo | A | 9-12 | 0-500 | 84 | S | State | 8 | cryptography,number theory
Graph Theory Shortest Path City Model | A | 9-12 | 500-1500 | 83 | H | State | 10 | graphs,algorithms
Linear Programming for School Canteen Planning | I | 10-12 | 0-400 | 76 | S | District | 6 | optimisation,lp
Statistical Prediction of Exam Performance | I | 9-12 | 0-400 | 74 | S | District | 6 | statistics,regression
SIR Epidemic Spread Mathematical Model | A | 10-12 | 0-600 | 88 | S | State | 8 | modelling,epidemic
Population Growth Logistic Model Study | I | 9-12 | 0-500 | 75 | S | District | 6 | growth,modelling
Game Theory Strategy Simulation | A | 10-12 | 0-500 | 82 | S | State | 8 | game theory,economics
Geometry Based Earthquake-Safe Architecture | I | 8-12 | 400-1200 | 80 | P | District | 8 | geometry,civil
Golden Ratio in Design and Perception Study | I | 7-12 | 100-500 | 70 | H | School | 6 | ratio,design
Pythagoras Theorem Water Demonstration Model | B | 6-10 | 200-700 | 64 | P | School | 4 | geometry,proof
Prime Number Distribution Visualiser | I | 9-12 | 0-300 | 77 | S | District | 5 | primes,visualisation
Queueing Theory Model for Hospital Counters | A | 11-12 | 0-500 | 84 | S | State | 8 | queueing,statistics
Data Compression Huffman Coding Demo | A | 10-12 | 0-400 | 82 | S | State | 7 | algorithms,compression
Symmetry and Tessellation Design Study | B | 5-10 | 100-500 | 62 | P | School | 5 | symmetry,art
`,
  },
  {
    subject: "Agriculture", category: "Agriculture",
    lines: `
Precision Drip Irrigation with Flow Control | A | 9-12 | 1800-4000 | 86 | H | State | 14 | irrigation,valve,sensor
Soil Nutrient Deficiency Colour Test Kit | I | 8-12 | 500-1500 | 79 | P | District | 8 | soil,testing
Automated Poly-House Ventilation Model | A | 9-12 | 2000-4500 | 85 | H | State | 14 | greenhouse,automation
Low-Cost Grain Moisture Meter | A | 9-12 | 1200-3000 | 84 | H | State | 10 | moisture,agriculture
Bird and Animal Crop Protection Alarm | I | 7-12 | 1200-2800 | 80 | H | District | 10 | pir,crop protection
Solar Insect Trap with Count Logging | A | 9-12 | 1500-3500 | 86 | H | State | 12 | pest,solar,logging
Cattle Health Activity Monitor | A | 10-12 | 1800-4000 | 85 | H | State | 12 | livestock,sensor
Mulching Effect on Soil Moisture Retention | B | 6-11 | 200-700 | 70 | P | School | 14 | soil,water
Organic vs Chemical Fertiliser Yield Study | I | 7-12 | 300-900 | 74 | P | District | 21 | fertiliser,experiment
Seed Sorting by Size and Density Machine | I | 8-12 | 1200-2800 | 81 | P | District | 12 | sorting,mechanism
Weather Forecast Based Sowing Advisor | A | 10-12 | 0-1000 | 85 | S | State | 8 | data,agriculture
Mini Solar Dryer for Farm Produce | I | 8-12 | 900-2200 | 82 | P | District | 10 | solar,drying
`,
  },
  {
    subject: "Engineering", category: "Engineering",
    lines: `
Load Bearing Bridge Design Comparison | I | 7-12 | 400-1200 | 78 | P | District | 8 | civil,structures
Cantilever Beam Deflection Study | I | 9-12 | 300-900 | 74 | P | District | 6 | mechanics,civil
Smart Traffic Flyover Model with Sensors | A | 9-12 | 2000-4500 | 86 | H | State | 14 | civil,traffic
Automatic Water Distribution Network Model | A | 9-12 | 1800-4000 | 84 | H | State | 12 | civil,water
Gear Ratio and Mechanical Advantage Rig | B | 6-11 | 400-1200 | 68 | P | School | 6 | mechanical,gears
Cooling Tower Heat Exchange Model | A | 10-12 | 1200-3000 | 83 | P | State | 12 | thermal,mechanical
3-Phase Motor Working Demonstration (Low Voltage) | A | 11-12 | 1500-3500 | 84 | P | State | 12 | electrical,motor,safe
Transformer Efficiency and Loss Study | A | 10-12 | 900-2200 | 80 | P | State | 10 | electrical,transformer
Microgrid with Solar and Battery Management | C | 11-12 | 3000-6000 | 92 | H | National | 18 | energy,microgrid
Prosthetic Hand with Tendon Mechanism | C | 10-12 | 2000-4500 | 93 | P | National | 18 | biomedical,mechanism
Low-Cost ECG Signal Visualiser (Educational) | C | 11-12 | 2000-4500 | 90 | H | National | 16 | biomedical,prototype
Water Turbine Blade Shape Efficiency Test | A | 9-12 | 900-2200 | 83 | P | State | 12 | hydro,mechanical
Smart Dam Gate Automation Model | A | 9-12 | 2000-4500 | 87 | H | State | 14 | civil,automation
Vibration Damping in Tall Structures | A | 10-12 | 1200-3000 | 86 | P | State | 12 | civil,damping
Automatic Sorting Conveyor with Counters | I | 8-12 | 1500-3200 | 80 | H | District | 12 | mechanical,automation
`,
  },
  {
    subject: "Energy", category: "Energy & Sustainability",
    lines: `
Hybrid Solar-Wind Power Model | A | 9-12 | 2000-4500 | 88 | P | State | 14 | renewable,hybrid
Solar Panel Tilt Angle Efficiency Study | I | 8-12 | 800-2000 | 76 | P | District | 8 | solar,efficiency
Solar Panel Dust Loss Measurement | I | 8-12 | 700-1800 | 80 | P | District | 8 | solar,maintenance
Battery Charge-Discharge Efficiency Study | A | 10-12 | 800-2000 | 82 | H | State | 10 | battery,energy
Supercapacitor vs Battery Comparison | A | 11-12 | 1200-3000 | 87 | P | State | 10 | energy storage
Energy Audit of a School Building | I | 8-12 | 200-900 | 78 | H | District | 10 | audit,efficiency
Waste-to-Energy Pellet Combustion Study (Safe) | A | 10-12 | 900-2200 | 84 | P | State | 12 | biomass,energy
Smart Load Shedding Priority Controller | A | 10-12 | 1500-3200 | 83 | H | State | 12 | energy,control
Human Powered Charging Station | I | 8-12 | 1200-2800 | 81 | P | District | 10 | dynamo,energy
Transparent Solar Window Concept Model | C | 10-12 | 2000-4500 | 90 | P | National | 14 | solar,materials
`,
  },
  {
    subject: "Computer Science", category: "Computer Science & Cyber",
    lines: `
Phishing Website Detection Tool | A | 10-12 | 0-500 | 86 | S | State | 8 | cybersecurity,ml
Password Strength and Breach Awareness Lab | I | 8-12 | 0-300 | 74 | S | District | 5 | cybersecurity,education
Steganography Image Message Hiding Demo | A | 9-12 | 0-400 | 84 | S | State | 7 | security,images
Two-Factor Authentication Demonstration | I | 9-12 | 0-500 | 78 | S | District | 6 | security,otp
Network Packet Flow Visualiser (Simulated) | A | 10-12 | 0-500 | 82 | S | State | 8 | networking,simulation
School Timetable Generator using Algorithms | I | 9-12 | 0-400 | 76 | S | District | 8 | algorithms,scheduling
Offline Study App with Spaced Repetition | I | 8-12 | 0-400 | 77 | S | District | 8 | education,software
Blockchain Certificate Verification Demo | A | 11-12 | 0-600 | 88 | S | State | 10 | blockchain,verification
Accessibility Screen Reader Prototype | A | 10-12 | 0-600 | 85 | S | State | 10 | accessibility,software
Local Language OCR for Kannada Text | C | 11-12 | 0-1000 | 92 | S | National | 14 | ocr,language,ai
`,
  },
  {
    subject: "Health Science", category: "Health Science",
    lines: `
Hand Hygiene Effectiveness Study (Safe Method) | B | 6-11 | 200-700 | 68 | P | School | 8 | hygiene,microbiology
Posture and Backpack Weight Study | B | 6-11 | 200-700 | 66 | H | School | 6 | ergonomics,health
Reaction Time Measurement Device | I | 7-12 | 600-1600 | 76 | H | District | 6 | neuroscience,electronics
Sleep Quality and Screen Time Survey Study | I | 8-12 | 0-400 | 74 | S | District | 10 | health,statistics
Nutrition Label Analysis of Snack Foods | B | 6-11 | 100-500 | 65 | S | School | 5 | nutrition,data
Low-Cost Pulse Oximeter Educational Model | A | 10-12 | 1500-3500 | 86 | H | State | 12 | health,sensor,prototype
Water Intake Reminder Smart Bottle | I | 8-12 | 1200-2800 | 78 | H | District | 10 | health,iot
Air Quality Impact on Respiratory Health Survey | A | 9-12 | 600-1600 | 84 | H | State | 12 | health,air quality
Mosquito Breeding Site Mapping Study | I | 7-12 | 200-800 | 79 | H | District | 10 | public health,mapping
Vision Screening Chart Digital Assistant | I | 8-12 | 0-600 | 75 | S | District | 6 | health,software
`,
  },
  {
    subject: "Geography", category: "Geography & Earth Science",
    lines: `
Watershed Model with Runoff Measurement | I | 7-12 | 500-1500 | 78 | P | District | 8 | water,geography
Soil Erosion under Different Ground Covers | I | 6-12 | 300-900 | 76 | P | District | 10 | erosion,soil
Contour Mapping of a School Ground | I | 8-12 | 200-800 | 74 | H | District | 8 | mapping,survey
Volcano Structure and Eruption Model (Safe) | B | 4-9 | 200-700 | 60 | P | School | 5 | geology,model
Plate Tectonics Movement Simulator | I | 6-11 | 300-900 | 72 | P | School | 6 | geology,tectonics
Groundwater Level Monitoring Study | A | 9-12 | 1200-3000 | 85 | H | State | 12 | water,sensor
Local Climate Data Trend Analysis | I | 9-12 | 0-400 | 78 | S | District | 8 | climate,statistics
River Meander Formation Flume Model | I | 8-12 | 500-1500 | 80 | P | District | 8 | rivers,geomorphology
Cyclone Wind Pressure Resistance Test | A | 9-12 | 900-2200 | 84 | P | State | 10 | disaster,structures
Glacier Melt and Sea Level Rise Model | I | 7-12 | 300-900 | 79 | P | District | 6 | climate,demonstration
`,
  },
  {
    subject: "General Science", category: "Primary & Middle School",
    lines: `
Balloon Powered Car Distance Study | B | 1-5 | 50-200 | 50 | P | School | 2 | motion,fun
Volcano Baking Soda Reaction Model | B | 1-5 | 100-300 | 48 | P | School | 2 | reaction,safe
Floating and Sinking Density Experiment | B | 1-5 | 50-200 | 46 | P | School | 2 | density,water
Simple Electric Circuit Light House | B | 2-6 | 150-400 | 52 | P | School | 3 | circuit,basics
Water Cycle in a Jar | B | 1-5 | 100-300 | 50 | P | School | 2 | water cycle,weather
Shadow and Sun Position Tracker | B | 1-5 | 50-200 | 48 | P | School | 3 | light,sun
Magnet Strength Comparison Study | B | 2-6 | 100-400 | 54 | P | School | 3 | magnets,measurement
Plant Needs Sunlight Experiment | B | 1-5 | 50-250 | 50 | P | School | 10 | plants,experiment
Homemade Water Filter Layers | B | 3-7 | 150-400 | 58 | P | School | 3 | filtration,water
Air Pressure Bottle Fountain | B | 3-7 | 100-300 | 55 | P | School | 3 | pressure,air
Simple Pulley Lifting Advantage | B | 3-8 | 150-500 | 56 | P | School | 3 | machines,force
Rainbow Light Dispersion with Prism | B | 3-8 | 200-600 | 57 | P | School | 3 | light,dispersion
Egg Drop Impact Protection Challenge | B | 3-8 | 100-400 | 60 | P | School | 3 | impact,design
Solar Oven from Cardboard Box | B | 4-9 | 200-600 | 62 | P | School | 4 | solar,heat
Static Electricity Charge Detector | B | 4-9 | 100-400 | 58 | P | School | 3 | static,electricity
Germination in Different Soils | B | 2-7 | 100-300 | 52 | P | School | 10 | plants,soil
Sound Travels Through Solids Experiment | B | 3-8 | 100-300 | 54 | P | School | 3 | sound,waves
Making a Simple Electromagnet | B | 4-9 | 150-450 | 60 | P | School | 3 | electromagnet,coil
Rusting Conditions Experiment | B | 4-9 | 100-350 | 56 | P | School | 8 | rust,chemistry
Milk Rainbow Surface Tension Demo | B | 2-6 | 50-200 | 48 | P | School | 2 | surface tension,colour
`,
  },
  {
    subject: "Sustainable Development", category: "Sustainability & Society",
    lines: `
Zero-Waste School Canteen Design Study | I | 7-12 | 100-600 | 76 | H | District | 10 | waste,policy
Water Footprint of Everyday Foods | I | 8-12 | 0-400 | 78 | S | District | 8 | water,data
Sustainable Housing Material Comparison | A | 9-12 | 600-1600 | 84 | P | State | 12 | construction,materials
Public Transport Efficiency Analysis | I | 9-12 | 0-500 | 79 | S | District | 8 | transport,data
Solar Adoption Feasibility for a Village | A | 10-12 | 200-1000 | 85 | S | State | 10 | energy,planning
Rain Garden Stormwater Absorption Model | I | 8-12 | 500-1500 | 80 | P | District | 10 | water,urban
Circular Economy Product Redesign Project | A | 9-12 | 400-1200 | 83 | P | State | 10 | design,recycling
Community Disaster Preparedness Kit Design | I | 7-12 | 300-1000 | 77 | P | District | 8 | disaster,community
`,
  },
  {
    subject: "Electronics", category: "Electronics",
    lines: `
Digital Thermometer with 7-Segment Display | B | 8-12 | 400-1200 | 66 | P | School | 5 | display,sensor
Water Level Indicator with Buzzer Stages | B | 6-11 | 300-900 | 62 | P | School | 4 | water,alarm
Automatic Night Lamp with Hysteresis | B | 7-11 | 300-900 | 64 | P | School | 4 | ldr,circuit
Metal Detector Coil Circuit | I | 8-12 | 500-1500 | 76 | P | District | 6 | coil,detection
Ultrasonic Distance Measuring Tape | I | 8-12 | 700-1800 | 74 | H | District | 6 | ultrasonic,measurement
Heartbeat Sensor Display (Educational) | I | 9-12 | 800-2000 | 78 | H | District | 8 | sensor,health
Solar Charge Controller Circuit | A | 10-12 | 900-2200 | 82 | P | State | 10 | solar,electronics
Simple FM Transmitter/Receiver Study | A | 10-12 | 800-2000 | 83 | P | State | 10 | rf,communication
Touchless Doorbell / Switch | B | 7-12 | 400-1200 | 70 | P | School | 4 | ir,hygiene
Automatic Plant Watering Circuit (No Code) | B | 6-11 | 500-1400 | 68 | P | School | 5 | moisture,relay
Voice Level Meter with LED Bar | B | 7-12 | 400-1200 | 66 | P | School | 5 | audio,leds
Smart Reverse Parking Sensor | I | 8-12 | 900-2200 | 78 | H | District | 8 | ultrasonic,vehicle
`,
  },
  {
    subject: "Computer Vision", category: "Computer Vision",
    lines: `
Vehicle Counting from Traffic Video | A | 10-12 | 0-1500 | 88 | H | State | 12 | vision,traffic
Helmet Compliance Detection (Anonymous Counting) | A | 10-12 | 1500-3500 | 89 | H | State | 14 | vision,safety,privacy
Crop Weed Detection Camera Rig | C | 10-12 | 2000-4500 | 92 | H | National | 16 | vision,agriculture
Product Defect Detection Conveyor | A | 10-12 | 2000-4500 | 89 | H | State | 14 | vision,quality
Water Level Reading from Camera Images | A | 10-12 | 1200-3000 | 87 | H | State | 12 | vision,flood
Litter Detection on Streets (Object Only) | A | 9-12 | 1500-3500 | 88 | H | State | 12 | vision,waste,privacy
Reading Analog Meters with a Camera | A | 10-12 | 1200-3000 | 86 | H | State | 12 | vision,automation
Sign Board Recognition for Assistive Navigation | C | 10-12 | 2000-4500 | 91 | H | National | 16 | vision,accessibility
`,
  },
  {
    subject: "Statistics", category: "Statistics & Data",
    lines: `
Survey Design and Sampling Bias Experiment | I | 8-12 | 0-300 | 74 | S | District | 7 | survey,sampling
Correlation vs Causation Demonstration Study | I | 9-12 | 0-300 | 78 | S | District | 6 | statistics,logic
Weather Data Regression Forecast | A | 10-12 | 0-500 | 82 | S | State | 8 | regression,weather
Traffic Accident Data Hotspot Analysis | A | 10-12 | 0-500 | 85 | S | State | 8 | data,safety
Crop Yield vs Rainfall Statistical Study | A | 10-12 | 0-500 | 83 | S | State | 8 | agriculture,data
Sports Performance Data Analysis | I | 9-12 | 0-300 | 74 | S | District | 6 | data,sports
Exam Score Distribution and Normality Study | I | 10-12 | 0-300 | 72 | S | District | 6 | statistics,education
`,
  },
];

function parse(): ScienceProject[] {
  const out: ScienceProject[] = [];
  for (const block of BLOCKS) {
    for (const raw of block.lines.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const [title, d, cls, cost, innov, t, comp, days, tags] = line.split("|").map((s) => s.trim());
      const [minClass, maxClass] = cls.split("-").map(Number);
      const [costMin, costMax] = cost.split("-").map(Number);
      const tagList = (tags ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      out.push({
        id,
        title,
        subject: block.subject,
        category: block.category,
        difficulty: DIFF[d] ?? "Intermediate",
        minClass, maxClass,
        costMin, costMax,
        innovation: Number(innov),
        type: TYPE[t] ?? "Physical",
        ai: tagList.includes("ai") || block.subject === "Artificial Intelligence" || block.subject === "Computer Vision" || tagList.includes("ml"),
        sensors: /sensor|ultrasonic|ldr|iot|moisture|dht11|mpu6050|pir|ir |camera/i.test(tags ?? "") || block.category === "IoT",
        tags: tagList,
        competition: comp,
        days: Number(days),
      });
    }
  }
  return out;
}

export const PROJECTS: ScienceProject[] = parse();

export const CATEGORIES = Array.from(new Set(PROJECTS.map((p) => p.category))).sort();

export function getProject(id: string) {
  return PROJECTS.find((p) => p.id === id);
}

export interface Filters {
  q?: string;
  classLevel?: number;
  subject?: string;
  category?: string;
  difficulty?: string;
  budgetMax?: number;
  competition?: string;
  type?: string;
  aiOnly?: boolean;
  maxDays?: number;
}

/** Ranking engine: class fit + subject + competition + innovation + budget + time. */
export function rankProjects(f: Filters): ScienceProject[] {
  const q = (f.q ?? "").toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);

  return PROJECTS
    .map((p) => {
      let score = p.innovation * 0.4;
      let ok = true;

      if (f.classLevel) {
        if (p.minClass <= f.classLevel && f.classLevel <= p.maxClass) score += 25;
        else if (Math.abs(p.minClass - f.classLevel) <= 2) score += 6;
        else ok = false;
      }
      if (f.subject && f.subject !== "Any") {
        if (p.subject === f.subject) score += 20;
        else if (p.tags.join(" ").toLowerCase().includes(f.subject.toLowerCase())) score += 8;
        else ok = false;
      }
      if (f.category && f.category !== "Any" && p.category !== f.category) ok = false;
      if (f.difficulty && f.difficulty !== "Any" && p.difficulty !== f.difficulty) ok = false;
      if (f.type && f.type !== "Any" && p.type !== f.type) ok = false;
      if (f.aiOnly && !p.ai) ok = false;
      if (f.competition && f.competition !== "Any") {
        const order = ["School", "District", "State", "National"];
        const need = order.indexOf(f.competition);
        const has = order.indexOf(p.competition);
        if (has < need - 1) ok = false;
        else score += has >= need ? 15 : 5;
      }
      if (f.budgetMax) {
        if (p.costMin > f.budgetMax) ok = false;
        else score += p.costMax <= f.budgetMax ? 12 : 4;
      }
      if (f.maxDays) {
        if (p.days > f.maxDays * 1.3) ok = false;
        else score += p.days <= f.maxDays ? 10 : 3;
      }
      if (terms.length) {
        const hay = `${p.title} ${p.subject} ${p.category} ${p.tags.join(" ")}`.toLowerCase();
        const hits = terms.filter((t) => hay.includes(t)).length;
        if (!hits) ok = false;
        score += hits * 14;
      }
      if (p.type !== "Software") score += 6; // exhibitions favour physical models

      return { p, score, ok };
    })
    .filter((r) => r.ok)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}

/** Very light natural-language intent parser for the JARVIS search bar. */
export function parseQuery(text: string): Filters {
  const t = text.toLowerCase();
  const f: Filters = { q: "" };

  const puc = t.match(/(1st|first)\s*puc/) ? 11 : t.match(/(2nd|second)\s*puc/) ? 12 : undefined;
  const cls = t.match(/class\s*(\d{1,2})/);
  f.classLevel = puc ?? (cls ? Math.min(12, Number(cls[1])) : undefined);

  const money = t.match(/(?:₹|rs\.?|inr)\s*([\d,]+)|under\s*([\d,]+)/);
  if (money) f.budgetMax = Number((money[1] ?? money[2]).replace(/,/g, ""));

  const days = t.match(/(\d{1,3})\s*(days?|weeks?)/);
  if (days) f.maxDays = Number(days[1]) * (days[2].startsWith("week") ? 7 : 1);

  for (const lvl of ["national", "state", "district", "school"]) {
    if (t.includes(lvl)) { f.competition = lvl[0].toUpperCase() + lvl.slice(1); break; }
  }
  const subjectHit = [
    "physics", "chemistry", "biology", "mathematics", "robotics", "astronomy",
    "agriculture", "electronics", "statistics", "geography", "energy",
  ].find((s) => t.includes(s));
  if (subjectHit) f.subject = subjectHit[0].toUpperCase() + subjectHit.slice(1);
  if (t.includes("environment")) f.subject = "Environmental Science";
  if (t.includes("iot")) f.subject = "IoT";

  if (/\b(ai|artificial intelligence|machine learning|ml)\b/.test(t)) f.aiOnly = true;
  if (/physical|working model|exhibition model|hardware/.test(t)) f.type = "Physical";

  const stop = new Set(["give", "me", "a", "an", "the", "i", "need", "want", "for", "with", "and", "project", "projects", "under", "have", "days", "only", "something", "my", "is", "it", "must", "be", "use", "uses", "level", "class", "puc"]);
  f.q = t.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w) && !/^\d+$/.test(w)).slice(0, 3).join(" ");
  if (f.q && rankProjects(f).length === 0) f.q = "";
  return f;
}
