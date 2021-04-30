

class TestShip:
    def __init__(self, test_reason: str, loadout_event: str, expected_result: str):
        self.test_reason = test_reason
        self.loadout_event = loadout_event
        self.expected_result = expected_result


test_ships = [
    TestShip(
        "Example Keelback (No Engineering)",
        r'{ "timestamp":"2021-04-22T15:05:39Z", "event":"Loadout", "Ship":"independant_trader", "ShipID":4, '
        r'"ShipName":" ", "ShipIdent":"GO-10I", "HullValue":3126154, "ModulesValue":3080180, "HullHealth":1.000000, '
        r'"UnladenMass":282.600006, "CargoCapacity":8, "MaxJumpRange":16.945702, "FuelCapacity":{ "Main":16.000000, '
        r'"Reserve":0.390000 }, "Rebuy":310319, "Modules":[ { "Slot":"SmallHardpoint1", '
        r'"Item":"hpt_pulselaser_gimbal_small", "On":true, "Priority":0, "Health":1.000000, "Value":6600 }, '
        r'{ "Slot":"SmallHardpoint2", "Item":"hpt_pulselaser_gimbal_small", "On":true, "Priority":0, '
        r'"Health":1.000000, "Value":6600 }, { "Slot":"MediumHardpoint1", "Item":"hpt_multicannon_gimbal_medium", '
        r'"On":true, "Priority":0, "AmmoInClip":90, "AmmoInHopper":2100, "Health":1.000000, "Value":57000 }, '
        r'{ "Slot":"MediumHardpoint2", "Item":"hpt_multicannon_gimbal_medium", "On":true, "Priority":0, '
        r'"AmmoInClip":90, "AmmoInHopper":2100, "Health":1.000000, "Value":57000 }, { "Slot":"TinyHardpoint1", '
        r'"Item":"hpt_chafflauncher_tiny", "On":true, "Priority":0, "AmmoInClip":1, "AmmoInHopper":10, '
        r'"Health":1.000000, "Value":8500 }, { "Slot":"TinyHardpoint2", "Item":"hpt_heatsinklauncher_turret_tiny", '
        r'"On":true, "Priority":0, "AmmoInClip":1, "AmmoInHopper":2, "Health":1.000000, "Value":3500 }, '
        r'{ "Slot":"TinyHardpoint3", "Item":"hpt_plasmapointdefence_turret_tiny", "On":true, "Priority":0, '
        r'"AmmoInClip":12, "AmmoInHopper":10000, "Health":1.000000, "Value":18546 }, { "Slot":"Armour", '
        r'"Item":"independant_trader_armour_grade1", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"PowerPlant", "Item":"int_powerplant_size4_class4", "On":true, "Priority":1, "Health":1.000000, '
        r'"Value":480411 }, { "Slot":"MainEngines", "Item":"int_engine_size4_class3", "On":true, "Priority":0, '
        r'"Health":1.000000, "Value":178898 }, { "Slot":"FrameShiftDrive", "Item":"int_hyperdrive_size4_class4", '
        r'"On":true, "Priority":0, "Health":1.000000, "Value":536693 }, { "Slot":"LifeSupport", '
        r'"Item":"int_lifesupport_size1_class2", "On":true, "Priority":0, "Health":1.000000, "Value":1293 }, '
        r'{ "Slot":"PowerDistributor", "Item":"int_powerdistributor_size3_class2", "On":true, "Priority":0, '
        r'"Health":1.000000, "Value":10133 }, { "Slot":"Radar", "Item":"int_sensors_size2_class2", "On":true, '
        r'"Priority":0, "Health":1.000000, "Value":3619 }, { "Slot":"FuelTank", "Item":"int_fueltank_size4_class3", '
        r'"On":true, "Priority":1, "Health":1.000000 }, { "Slot":"Slot01_Size5", '
        r'"Item":"int_shieldgenerator_size5_class3", "On":true, "Priority":0, "Health":1.000000, "Value":567106 }, '
        r'{ "Slot":"Slot02_Size5", "Item":"int_fighterbay_size5_class1", "On":true, "Priority":0, "Health":1.000000, '
        r'"Value":575643 }, { "Slot":"Slot03_Size3", "Item":"int_buggybay_size4_class2", "On":true, "Priority":0, '
        r'"Health":1.000000, "Value":86400 }, { "Slot":"Slot04_Size3", "Item":"int_fuelscoop_size3_class4", '
        r'"On":true, "Priority":0, "Health":1.000000, "Value":225738 }, { "Slot":"Slot05_Size2", '
        r'"Item":"int_cargorack_size2_class1", "On":true, "Priority":1, "Health":1.000000, "Value":3250 }, '
        r'{ "Slot":"Slot06_Size2", "Item":"int_cargorack_size2_class1", "On":true, "Priority":1, "Health":1.000000, '
        r'"Value":3250 }, { "Slot":"Slot07_Size1", "Item":"int_detailedsurfacescanner_tiny", "On":true, "Priority":0, '
        r'"Health":1.000000, "Value":250000 }, { "Slot":"PlanetaryApproachSuite", '
        r'"Item":"int_planetapproachsuite_advanced", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"VesselVoice", "Item":"voicepack_verity", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"ShipCockpit", "Item":"independant_trader_cockpit", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"CargoHatch", "Item":"modularcargobaydoor", "On":true, "Priority":2, "Health":1.000000 } ] }',
        r'{"$schema":"https://coriolis.io/schemas/ship-loadout/4.json#","name":"MyShip","ship":"Keelback",'
        r'"references":[{"name":"Coriolis.io",'
        r'"url":"https://coriolis.io/outfit/keelback?code=A0pbtcFbl3dds8f4272718180002034cfrv42u01012i.Iw18cQ%3D%3D'
        r'.EwRgDBldEuQ%3D.&bn=MyShip","code":"A0pbtcFbl3dds8f4272718180002034cfrv42u01012i.Iw18cQ==.EwRgDBldEuQ=.",'
        r'"shipId":"keelback"}],"components":{"standard":{"bulkheads":"Lightweight Alloy","cargoHatch":{'
        r'"enabled":true,"priority":3},"powerPlant":{"class":4,"rating":"B","enabled":true,"priority":2},'
        r'"thrusters":{"class":4,"rating":"C","enabled":true,"priority":1},"frameShiftDrive":{"class":4,"rating":"B",'
        r'"enabled":true,"priority":1},"lifeSupport":{"class":1,"rating":"D","enabled":true,"priority":1},'
        r'"powerDistributor":{"class":3,"rating":"D","enabled":true,"priority":1},"sensors":{"class":2,"rating":"D",'
        r'"enabled":true,"priority":1},"fuelTank":{"class":4,"rating":"C","enabled":true,"priority":1}},'
        r'"hardpoints":[{"class":2,"rating":"F","enabled":true,"priority":1,"group":"Multi-cannon",'
        r'"mount":"Gimballed"},{"class":2,"rating":"F","enabled":true,"priority":1,"group":"Multi-cannon",'
        r'"mount":"Gimballed"},{"class":1,"rating":"G","enabled":true,"priority":1,"group":"Pulse Laser",'
        r'"mount":"Gimballed"},{"class":1,"rating":"G","enabled":true,"priority":1,"group":"Pulse Laser",'
        r'"mount":"Gimballed"}],"utility":[{"class":0,"rating":"I","enabled":true,"priority":1,"group":"Chaff '
        r'Launcher","name":"Chaff Launcher"},{"class":0,"rating":"I","enabled":true,"priority":1,"group":"Heat Sink '
        r'Launcher","name":"Heat Sink Launcher"},{"class":0,"rating":"I","enabled":true,"priority":1,"group":"Point '
        r'Defence","name":"Point Defence"}],"internal":[{"class":5,"rating":"C","enabled":true,"priority":1,'
        r'"group":"Shield Generator"},{"class":5,"rating":"D","enabled":true,"priority":1,"group":"Fighter Hangar"},'
        r'{"class":4,"rating":"G","enabled":true,"priority":1,"group":"Planetary Vehicle Hangar"},{"class":3,'
        r'"rating":"B","enabled":true,"priority":1,"group":"Fuel Scoop"},{"class":2,"rating":"E","enabled":true,'
        r'"priority":2,"group":"Cargo Rack"},{"class":2,"rating":"E","enabled":true,"priority":2,"group":"Cargo '
        r'Rack"},{"class":1,"rating":"I","enabled":true,"priority":1,"group":"Surface Scanner","name":"Detailed '
        r'Surface Scanner"}]},"stats":{"class":2,"hullCost":2943870,"speed":200,"boost":300,"boostEnergy":10,'
        r'"baseShieldStrength":135,"baseArmour":270,"hardness":45,"heatCapacity":215,"hullMass":180,"masslock":8,'
        r'"pipSpeed":0.14,"fighterHangars":1,"pitch":27,"roll":100,"yaw":15,"crew":2,"reserveFuelCapacity":0.39,'
        r'"moduleCostMultiplier":1,"fuelCapacity":16,"cargoCapacity":8,"passengerCapacity":0,"ladenMass":306.6,'
        r'"armour":270,"shield":135,"shieldCells":0,"totalCost":6105064,"unladenMass":282.6,"totalDpe":0,'
        r'"totalAbsDpe":0,"totalExplDpe":0,"totalKinDpe":0,"totalThermDpe":0,"totalDps":0,"totalAbsDps":0,'
        r'"totalExplDps":0,"totalKinDps":0,"totalThermDps":0,"totalSDps":0,"totalAbsSDps":0,"totalExplSDps":0,'
        r'"totalKinSDps":0,"totalThermSDps":0,"totalEps":0,"totalHps":0,"shieldExplRes":0,"shieldKinRes":0,'
        r'"shieldThermRes":0,"hullExplRes":0,"hullKinRes":0,"hullThermRes":0,"topSpeed":205.87,"topBoost":308.81,'
        r'"topPitch":27.79,"topRoll":102.94,"topYaw":15.44,"unladenRange":16.9,"fullTankRange":16.14,'
        r'"ladenRange":15.72,"unladenFastestRange":110.34,"ladenFastestRange":107.39,"maxJumpCount":7}} '
    ),
    TestShip(
        "Example Anaconda (With Engineering)",
        r'{ "timestamp":"2021-04-22T21:14:00Z", "event":"Loadout", "Ship":"anaconda", "ShipID":16, '
        r'"ShipName":"SnakesHaveLegs", "ShipIdent":"#SNKLG", "HullValue":121087130, "ModulesValue":130652560, '
        r'"HullHealth":1.000000, "UnladenMass":512.377625, "CargoCapacity":96, "MaxJumpRange":78.488853, '
        r'"FuelCapacity":{ "Main":32.000000, "Reserve":1.070000 }, "Rebuy":12586987, "Modules":[ { '
        r'"Slot":"ShipCockpit", "Item":"anaconda_cockpit", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"CargoHatch", "Item":"modularcargobaydoor", "On":false, "Priority":2, "Health":1.000000 }, '
        r'{ "Slot":"TinyHardpoint1", "Item":"hpt_heatsinklauncher_turret_tiny", "On":true, "Priority":0, '
        r'"AmmoInClip":1, "AmmoInHopper":2, "Health":1.000000 }, { "Slot":"Armour", "Item":"anaconda_armour_grade1", '
        r'"On":true, "Priority":1, "Health":1.000000, "Engineering":{ "Engineer":"Selene Jean", "EngineerID":300210, '
        r'"BlueprintID":128673643, "BlueprintName":"Armour_HeavyDuty", "Level":4, "Quality":0.890000, "Modifiers":[ { '
        r'"Label":"DefenceModifierHealthMultiplier", "Value":127.970001, "OriginalValue":79.999992, "LessIsGood":0 }, '
        r'{ "Label":"KineticResistance", "Value":-15.332007, "OriginalValue":-20.000004, "LessIsGood":0 }, '
        r'{ "Label":"ThermicResistance", "Value":3.890002, "OriginalValue":0.000000, "LessIsGood":0 }, '
        r'{ "Label":"ExplosiveResistance", "Value":-34.553993, "OriginalValue":-39.999996, "LessIsGood":0 } ] } }, '
        r'{ "Slot":"PaintJob", "Item":"paintjob_anaconda_horus2_02", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"PowerPlant", "Item":"int_guardianpowerplant_size3", "On":true, "Priority":1, "Health":1.000000 }, '
        r'{ "Slot":"MainEngines", "Item":"int_engine_size5_class2", "On":true, "Priority":0, "Health":1.000000, '
        r'"Engineering":{ "Engineer":"Felicity Farseer", "EngineerID":300100, "BlueprintID":128673665, '
        r'"BlueprintName":"Engine_Tuned", "Level":1, "Quality":1.000000, '
        r'"ExperimentalEffect":"special_engine_lightweight", "ExperimentalEffect_Localised":"Reduktion", '
        r'"Modifiers":[ { "Label":"Mass", "Value":7.200000, "OriginalValue":8.000000, "LessIsGood":1 }, '
        r'{ "Label":"EngineOptimalMass", "Value":617.400024, "OriginalValue":630.000000, "LessIsGood":0 }, '
        r'{ "Label":"EngineOptPerformance", "Value":108.000015, "OriginalValue":100.000000, "LessIsGood":0 }, '
        r'{ "Label":"EngineHeatRate", "Value":1.040000, "OriginalValue":1.300000, "LessIsGood":1 } ] } }, '
        r'{ "Slot":"FrameShiftDrive", "Item":"int_hyperdrive_size6_class5", "On":true, "Priority":0, '
        r'"Health":0.992657, "Engineering":{ "Engineer":"Felicity Farseer", "EngineerID":300100, '
        r'"BlueprintID":128673694, "BlueprintName":"FSD_LongRange", "Level":5, "Quality":1.000000, '
        r'"ExperimentalEffect":"special_fsd_heavy", "ExperimentalEffect_Localised":"Massemanager", "Modifiers":[ { '
        r'"Label":"Mass", "Value":52.000000, "OriginalValue":40.000000, "LessIsGood":1 }, { "Label":"Integrity", '
        r'"Value":110.262009, "OriginalValue":141.000000, "LessIsGood":0 }, { "Label":"PowerDraw", "Value":0.862500, '
        r'"OriginalValue":0.750000, "LessIsGood":1 }, { "Label":"FSDOptimalMass", "Value":2901.599854, '
        r'"OriginalValue":1800.000000, "LessIsGood":0 } ] } }, { "Slot":"LifeSupport", '
        r'"Item":"int_lifesupport_size5_class2", "On":true, "Priority":0, "Health":1.000000, "Engineering":{ '
        r'"Engineer":"Lori Jameson", "EngineerID":300230, "BlueprintID":128731494, '
        r'"BlueprintName":"Misc_LightWeight", "Level":4, "Quality":0.877000, "Modifiers":[ { "Label":"Mass", '
        r'"Value":2.098400, "OriginalValue":8.000000, "LessIsGood":1 }, { "Label":"Integrity", "Value":51.600002, '
        r'"OriginalValue":86.000000, "LessIsGood":0 } ] } }, { "Slot":"PowerDistributor", '
        r'"Item":"int_powerdistributor_size5_class5", "On":true, "Priority":0, "Health":1.000000, "Engineering":{ '
        r'"Engineer":"Marco Qwent", "EngineerID":300200, "BlueprintID":128673740, '
        r'"BlueprintName":"PowerDistributor_PriorityEngines", "Level":1, "Quality":0.966000, '
        r'"ExperimentalEffect":"special_powerdistributor_lightweight", "ExperimentalEffect_Localised":"Reduktion", '
        r'"Modifiers":[ { "Label":"Mass", "Value":18.000000, "OriginalValue":20.000000, "LessIsGood":1 }, '
        r'{ "Label":"WeaponsCapacity", "Value":39.770000, "OriginalValue":41.000000, "LessIsGood":0 }, '
        r'{ "Label":"WeaponsRecharge", "Value":4.257000, "OriginalValue":4.300000, "LessIsGood":0 }, '
        r'{ "Label":"EnginesCapacity", "Value":34.701401, "OriginalValue":29.000000, "LessIsGood":0 }, '
        r'{ "Label":"EnginesRecharge", "Value":2.900000, "OriginalValue":2.500000, "LessIsGood":0 }, '
        r'{ "Label":"SystemsCapacity", "Value":28.130001, "OriginalValue":29.000000, "LessIsGood":0 }, '
        r'{ "Label":"SystemsRecharge", "Value":2.425000, "OriginalValue":2.500000, "LessIsGood":0 } ] } }, '
        r'{ "Slot":"Radar", "Item":"int_sensors_size8_class2", "On":true, "Priority":0, "Health":1.000000, '
        r'"Engineering":{ "Engineer":"Lei Cheung", "EngineerID":300120, "BlueprintID":128740673, '
        r'"BlueprintName":"Sensor_LightWeight", "Level":5, "Quality":0.981300, "Modifiers":[ { "Label":"Mass", '
        r'"Value":12.979198, "OriginalValue":64.000000, "LessIsGood":1 }, { "Label":"Integrity", "Value":60.000000, '
        r'"OriginalValue":120.000000, "LessIsGood":0 }, { "Label":"SensorTargetScanAngle", "Value":22.500000, '
        r'"OriginalValue":30.000000, "LessIsGood":0 } ] } }, { "Slot":"FuelTank", "Item":"int_fueltank_size5_class3", '
        r'"On":true, "Priority":1, "Health":1.000000 }, { "Slot":"Decal1", "Item":"decal_distantworlds2", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Decal2", "Item":"decal_distantworlds2", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Decal3", "Item":"decal_distantworlds2", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Slot01_Size7", "Item":"int_fuelscoop_size7_class5", "On":true, '
        r'"Priority":0, "Health":1.000000 }, { "Slot":"Slot02_Size6", "Item":"int_repairer_size6_class5", "On":false, '
        r'"Priority":2, "Health":1.000000 }, { "Slot":"Slot03_Size6", "Item":"int_repairer_size6_class5", "On":false, '
        r'"Priority":2, "Health":1.000000 }, { "Slot":"Slot04_Size6", "Item":"int_cargorack_size6_class1", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Slot06_Size5", "Item":"int_guardianfsdbooster_size5", '
        r'"On":true, "Priority":0, "Health":1.000000 }, { "Slot":"Slot07_Size5", "Item":"int_cargorack_size5_class1", '
        r'"On":true, "Priority":1, "Health":1.000000 }, { "Slot":"Slot08_Size4", "Item":"int_buggybay_size4_class2", '
        r'"On":false, "Priority":1, "Health":1.000000 }, { "Slot":"Slot09_Size4", '
        r'"Item":"int_shieldgenerator_size4_class2", "On":true, "Priority":0, "Health":1.000000, "Engineering":{ '
        r'"Engineer":"Lei Cheung", "EngineerID":300120, "BlueprintID":128673820, '
        r'"BlueprintName":"ShieldGenerator_Kinetic", "Level":1, "Quality":0.931000, '
        r'"ExperimentalEffect":"special_shield_lightweight", "ExperimentalEffect_Localised":"Reduktion", '
        r'"Modifiers":[ { "Label":"Mass", "Value":3.600000, "OriginalValue":4.000000, "LessIsGood":1 }, '
        r'{ "Label":"Integrity", "Value":57.600002, "OriginalValue":48.000000, "LessIsGood":0 }, '
        r'{ "Label":"KineticResistance", "Value":45.585995, "OriginalValue":39.999996, "LessIsGood":0 }, '
        r'{ "Label":"ThermicResistance", "Value":-23.600006, "OriginalValue":-20.000004, "LessIsGood":0 } ] } }, '
        r'{ "Slot":"Slot10_Size4", "Item":"int_dronecontrol_fueltransfer_size1_class2", "On":true, "Priority":0, '
        r'"Health":1.000000 }, { "Slot":"Slot13_Size2", "Item":"int_detailedsurfacescanner_tiny", "On":true, '
        r'"Priority":0, "Health":1.000000, "Engineering":{ "Engineer":"Lori Jameson", "EngineerID":300230, '
        r'"BlueprintID":128740151, "BlueprintName":"Sensor_Expanded", "Level":5, "Quality":0.935000, "Modifiers":[ { '
        r'"Label":"PowerDraw", "Value":0.000000, "OriginalValue":0.000000, "LessIsGood":1 }, '
        r'{ "Label":"DSS_PatchRadius", "Value":29.869999, "OriginalValue":20.000000, "LessIsGood":0 } ] } }, '
        r'{ "Slot":"Slot14_Size1", "Item":"int_dronecontrol_repair_size1_class2", "On":true, "Priority":0, '
        r'"Health":1.000000 }, { "Slot":"PlanetaryApproachSuite", "Item":"int_planetapproachsuite", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble01", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble02", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble03", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble04", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble05", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble06", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble07", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble08", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble09", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"Bobble10", "Item":"bobble_trophy_exploration", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"WeaponColour", "Item":"weaponcustomisation_green", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"EngineColour", "Item":"enginecustomisation_white", "On":true, '
        r'"Priority":1, "Health":1.000000 }, { "Slot":"VesselVoice", "Item":"voicepack_victor", "On":true, '
        r'"Priority":1, "Health":1.000000 } ] }',
        r'{"$schema":"https://coriolis.io/schemas/ship-loadout/4.json#","name":"MyShip","ship":"Anaconda",'
        r'"references":[{"name":"Coriolis.io",'
        r'"url":"https://coriolis.io/outfit/anaconda?code=A00BtiFklndksxf5--------02-------3h1111051O04v4-48F12i9q'
        r'-.AwRj4yvZTOJA.EwRgDBldMcphOaQ%3D.H4sIAAAAAAAACmP4x87AwPCXBUj8Z%2FonAWIzgtjM%2F6RAbFYQm'
        r'%2BUfJ1wN6z8ruBq2fwlwNQr%2FvOHiSv9i4eL%2FGaAAAAqNCKhpAAAA&bn=MyShip",'
        r'"code":"A00BtiFklndksxf5--------02-------3h1111051O04v4-48F12i9q-.AwRj4yvZTOJA.EwRgDBldMcphOaQ'
        r'=.H4sIAAAAAAAACmP4x87AwPCXBUj8Z/onAWIzgtjM/6RAbFYQm+UfJ1wN6z8ruBq2fwlwNQr/vOHiSv9i4eL/GaAAAAqNCKhpAAAA",'
        r'"shipId":"anaconda"}],"components":{"standard":{"bulkheads":"Lightweight Alloy","cargoHatch":{'
        r'"enabled":false,"priority":3},"powerPlant":{"class":3,"rating":"A","enabled":true,"priority":2,'
        r'"name":"Guardian Hybrid Power Plant"},"thrusters":{"class":5,"rating":"D","enabled":true,"priority":1,'
        r'"blueprint":{"fdname":"Engine_Tuned","grades":{"1":{"components":{"Sulphur":1},"features":{"optmass":['
        r'-0.02,-0.02],"optmul":[0,0.08],"thermload":[0,-0.2]},"uuid":"5b32dae1-7c4a-4760-8c48-0d9a9fa2758d"},'
        r'"2":{"components":{"Conductive Components":1,"Specialised Legacy Firmware":1},"features":{"integrity":['
        r'-0.04,-0.04],"optmass":[-0.04,-0.04],"optmul":[0.08,0.13],"power":[0.04,0.04],"thermload":[-0.2,-0.3]},'
        r'"uuid":"5382eecb-c840-4613-99c1-9bcbdb8d7760"},"3":{"components":{"Conductive Components":1,"Specialised '
        r'Legacy Firmware":1,"Unexpected Emission Data":1},"features":{"integrity":[-0.08,-0.08],"optmass":[-0.06,'
        r'-0.06],"optmul":[0.13,0.18],"power":[0.08,0.08],"thermload":[-0.3,-0.4]},'
        r'"uuid":"0c58a5c8-0bf9-4a2c-baf0-b14228f236df"},"4":{"components":{"Conductive Ceramics":1,"Decoded Emission '
        r'Data":1,"Modified Consumer Firmware":1},"features":{"integrity":[-0.12,-0.12],"optmass":[-0.08,-0.08],'
        r'"optmul":[0.18,0.23],"power":[0.12,0.12],"thermload":[-0.4,-0.5]},'
        r'"uuid":"afb2b22e-ab30-4195-8bfe-ae81ea6067f3"},"5":{"components":{"Abnormal Compact Emissions Data":1,'
        r'"Conductive Ceramics":1,"Tin":1},"features":{"integrity":[-0.16,-0.16],"optmass":[-0.1,-0.1],'
        r'"optmul":[0.23,0.28],"power":[0.16,0.16],"thermload":[-0.5,-0.6]},'
        r'"uuid":"74e6e223-c709-4c91-88d5-c55f9dfdf722"}},"id":24,"modulename":["Thrusters","Engines"],'
        r'"name":"Clean","grade":1}},"frameShiftDrive":{"class":6,"rating":"A","enabled":true,"priority":1,'
        r'"blueprint":{"fdname":"FSD_LongRange","grades":{"1":{"components":{"Atypical Disrupted Wake Echoes":1},'
        r'"features":{"integrity":[-0.03,-0.03],"mass":[0.1,0.1],"optmass":[0,0.15],"power":[0.03,0.03]},'
        r'"uuid":"bb67b1a2-7a5b-47bc-8ed8-e949b5e3fb16"},"2":{"components":{"Atypical Disrupted Wake Echoes":1,'
        r'"Chemical Processors":1},"features":{"integrity":[-0.06,-0.06],"mass":[0.15,0.15],"optmass":[0.15,0.25],'
        r'"power":[0.06,0.06]},"uuid":"74045351-f348-45f5-8798-487211f19520"},"3":{"components":{"Chemical '
        r'Processors":1,"Phosphorus":1,"Strange Wake Solutions":1},"features":{"integrity":[-0.09,-0.09],"mass":[0.2,'
        r'0.2],"optmass":[0.25,0.35],"power":[0.09,0.09]},"uuid":"cf196bb9-55a1-457f-893b-84ff2afd4db9"},'
        r'"4":{"components":{"Chemical Distillery":1,"Eccentric Hyperspace Trajectories":1,"Manganese":1},'
        r'"features":{"integrity":[-0.12,-0.12],"mass":[0.25,0.25],"optmass":[0.35,0.45],"power":[0.12,0.12]},'
        r'"uuid":"ecf49fec-32fd-4930-949d-a341bf0fd00c"},"5":{"components":{"Arsenic":1,"Chemical Manipulators":1,'
        r'"Datamined Wake Exceptions":1},"features":{"integrity":[-0.15,-0.15],"mass":[0.3,0.3],"optmass":[0.45,'
        r'0.55],"power":[0.15,0.15]},"uuid":"dddd4fd3-bc9a-4c5b-8606-853c63d0f554"}},"id":26,"modulename":["Frame '
        r'shift drive","FSD"],"name":"Increased range","grade":5}},"lifeSupport":{"class":5,"rating":"D",'
        r'"enabled":true,"priority":1,"blueprint":{"fdname":"Misc_LightWeight","grades":{"1":{"components":{'
        r'"Phosphorus":1},"features":{"integrity":[-0.1,-0.1],"mass":[0,-0.45]},'
        r'"uuid":"5ebd5d76-7bb8-4958-9cc3-f5e2176f2b5e"},"2":{"components":{"Manganese":1,"Salvaged Alloys":1},'
        r'"features":{"integrity":[-0.2,-0.2],"mass":[-0.45,-0.55]},"uuid":"c49d42a8-cd8f-4576-9c60-85725f635185"},'
        r'"3":{"components":{"Conductive Ceramics":1,"Manganese":1,"Salvaged Alloys":1},"features":{"integrity":['
        r'-0.3,-0.3],"mass":[-0.55,-0.65]},"uuid":"bc048a95-b5aa-4f6c-a696-6c40b87a1606"},"4":{"components":{'
        r'"Conductive Components":1,"Phase Alloys":1,"Proto Light Alloys":1},"features":{"integrity":[-0.4,-0.4],'
        r'"mass":[-0.65,-0.75]},"uuid":"4f9467f7-0c5f-4ab3-856b-aaad019bd79d"},"5":{"components":{"Conductive '
        r'Ceramics":1,"Proto Light Alloys":1,"Proto Radiolic Alloys":1},"features":{"integrity":[-0.5,-0.5],'
        r'"mass":[-0.75,-0.85]},"uuid":"15d2a67d-71b5-405a-ba21-4f94583064a3"}},"id":9,"modulename":["Chaff '
        r'launcher","Electronic counter measures","ECM","Wake scanner","Frame shift wake scanner","Heat sink '
        r'launcher","Kill warrant scanner","KWS","Cargo scanner","Manifest scanner","Point defence"],'
        r'"name":"Lightweight","grade":4}},"powerDistributor":{"class":5,"rating":"A","enabled":true,"priority":1,'
        r'"blueprint":{"fdname":"PowerDistributor_PriorityEngines","grades":{"1":{"components":{"Sulphur":1},'
        r'"features":{"engcap":[0,0.2],"engrate":[0,0.16],"syscap":[-0.03,-0.03],"sysrate":[-0.03,-0.03],'
        r'"wepcap":[-0.03,-0.03],"weprate":[-0.01,-0.01]},"uuid":"69f1b8a3-c868-452f-bdbd-cfc95e117ab5"},'
        r'"2":{"components":{"Conductive Components":1,"Sulphur":1},"features":{"engcap":[0.2,0.3],"engrate":[0.16,'
        r'0.23],"syscap":[-0.06,-0.06],"sysrate":[-0.06,-0.06],"wepcap":[-0.06,-0.06],"weprate":[-0.02,-0.02]},'
        r'"uuid":"5e91d652-7346-4a22-82c9-79853fdcdf91"},"3":{"components":{"Anomalous Bulk Scan Data":1,'
        r'"Chromium":1,"Electrochemical Arrays":1},"features":{"engcap":[0.3,0.4],"engrate":[0.23,0.3],'
        r'"syscap":[-0.09,-0.09],"sysrate":[-0.09,-0.09],"wepcap":[-0.09,-0.09],"weprate":[-0.03,-0.03]},'
        r'"uuid":"4185370a-c4e9-4f58-9b67-a7f46bb2d3c2"},"4":{"components":{"Unidentified Scan Archives":1,'
        r'"Selenium":1,"Polymer Capacitors":1},"features":{"engcap":[0.4,0.5],"engrate":[0.3,0.37],"syscap":[-0.12,'
        r'-0.12],"sysrate":[-0.12,-0.12],"wepcap":[-0.12,-0.12],"weprate":[-0.04,-0.04]},'
        r'"uuid":"6a6a497e-8261-4763-8a15-c78222a00443"},"5":{"components":{"Classified Scan Databanks":1,'
        r'"Cadmium":1,"Military Supercapacitors":1},"features":{"engcap":[0.5,0.6],"engrate":[0.37,0.44],'
        r'"syscap":[-0.15,-0.15],"sysrate":[-0.15,-0.15],"wepcap":[-0.15,-0.15],"weprate":[-0.05,-0.05]},'
        r'"uuid":"ac618c54-ecfc-489a-98cb-e3f5789ad69f"}},"id":58,"modulename":["Power distributor","Distributor"],'
        r'"name":"Engine focused","grade":1}},"sensors":{"class":8,"rating":"D","enabled":true,"priority":1,'
        r'"blueprint":{"fdname":"Sensor_LightWeight","grades":{"1":{"components":{"Phosphorus":1},"features":{'
        r'"integrity":[-0.1,-0.1],"mass":[0,-0.2],"angle":[-0.05,-0.05]},'
        r'"uuid":"239cd942-3298-4be0-b032-143961c801a1"},"2":{"components":{"Manganese":1,"Salvaged Alloys":1},'
        r'"features":{"integrity":[-0.2,-0.2],"mass":[-0.2,-0.35],"angle":[-0.1,-0.1]},'
        r'"uuid":"8dd41f78-c4f0-4107-a1fe-d1eee78bbd23"},"3":{"components":{"Conductive Ceramics":1,"Manganese":1,'
        r'"Salvaged Alloys":1},"features":{"integrity":[-0.3,-0.3],"mass":[-0.35,-0.5],"angle":[-0.15,-0.15]},'
        r'"uuid":"d51697d0-c837-4c0d-a6af-f192ace27e9a"},"4":{"components":{"Conductive Components":1,'
        r'"Phase Alloys":1,"Proto Light Alloys":1},"features":{"integrity":[-0.4,-0.4],"mass":[-0.5,-0.65],'
        r'"angle":[-0.2,-0.2]},"uuid":"01ccf913-c1cb-47a6-9515-1d2ee3e3b2ae"},"5":{"components":{"Conductive '
        r'Ceramics":1,"Proto Light Alloys":1,"Proto Radiolic Alloys":1},"features":{"integrity":[-0.5,-0.5],'
        r'"mass":[-0.65,-0.8],"angle":[-0.25,-0.25]},"uuid":"93c0ae86-d3ac-40c5-9ef3-b65c14d53cf6"}},"id":96,'
        r'"modulename":["Sensors"],"name":"Lightweight","grade":5}},"fuelTank":{"class":5,"rating":"C",'
        r'"enabled":true,"priority":1}},"hardpoints":[null,null,null,null,null,null,null,null],"utility":[{"class":0,'
        r'"rating":"I","enabled":true,"priority":1,"group":"Heat Sink Launcher","name":"Heat Sink Launcher"},null,'
        r'null,null,null,null,null,null],"internal":[{"class":7,"rating":"A","enabled":true,"priority":1,'
        r'"group":"Fuel Scoop"},{"class":6,"rating":"A","enabled":false,"priority":3,"group":"Auto Field-Maintenance '
        r'Unit"},{"class":6,"rating":"A","enabled":false,"priority":3,"group":"Auto Field-Maintenance Unit"},'
        r'{"class":6,"rating":"E","enabled":true,"priority":2,"group":"Cargo Rack"},{"class":5,"rating":"H",'
        r'"enabled":true,"priority":1,"group":"Guardian Frame Shift Drive Booster"},{"class":5,"rating":"E",'
        r'"enabled":true,"priority":2,"group":"Cargo Rack"},{"class":4,"rating":"G","enabled":false,"priority":2,'
        r'"group":"Planetary Vehicle Hangar"},null,{"class":4,"rating":"D","enabled":true,"priority":1,'
        r'"group":"Shield Generator","blueprint":{"fdname":"ShieldGenerator_Kinetic","grades":{"1":{"components":{'
        r'"Distorted Shield Cycle Recordings":1},"features":{"integrity":[0,0.2],"kinres":[0,0.1],"thermres":[-0.03,'
        r'-0.03]},"uuid":"df87f0c1-bd60-4e18-8a03-76063d635235"},"2":{"components":{"Distorted Shield Cycle '
        r'Recordings":1,"Modified Consumer Firmware":1},"features":{"integrity":[0.2,0.25],"kinres":[0.1,0.2],'
        r'"thermres":[-0.06,-0.06]},"uuid":"b67f86a0-866c-4233-9cd3-f5ea87a572eb"},"3":{"components":{"Distorted '
        r'Shield Cycle Recordings":1,"Modified Consumer Firmware":1,"Selenium":1},"features":{"integrity":[0.25,0.3],'
        r'"kinres":[0.2,0.3],"thermres":[-0.09,-0.09]},"uuid":"93979fd6-d135-4221-9a60-c9354e02619f"},'
        r'"4":{"components":{"Focus Crystals":1,"Inconsistent Shield Soak Analysis":1,"Mercury":1},"features":{'
        r'"integrity":[0.3,0.35],"kinres":[0.3,0.4],"thermres":[-0.12,-0.12]},'
        r'"uuid":"0e14c801-fd35-4bca-b97b-24da20d8c716"},"5":{"components":{"Refined Focus Crystals":1,"Ruthenium":1,'
        r'"Untypical Shield Scans":1},"features":{"integrity":[0.35,0.4],"kinres":[0.4,0.5],"thermres":[-0.15,'
        r'-0.15]},"uuid":"dfdb4767-78e1-4e5f-ae1a-aeb6ae2748c9"}},"id":75,"modulename":["Shield generator",'
        r'"Shields"],"name":"Kinetic resistant","grade":1}},{"class":1,"rating":"D","enabled":true,"priority":1,'
        r'"group":"Fuel Transfer Limpet Controller"},{"class":1,"rating":"I","enabled":true,"priority":1,'
        r'"group":"Surface Scanner","name":"Detailed Surface Scanner","blueprint":{"fdname":"Sensor_Expanded",'
        r'"grades":{"1":{"components":{"Mechanical Scrap":1},"features":{"mass":[0.2,0.2],"proberadius":[0,0.1]},'
        r'"uuid":"d2f404d2-a8b9-4dfb-ae3c-43f0208123cb"},"2":{"components":{"Mechanical Scrap":1,"Germanium":1},'
        r'"features":{"mass":[0.4,0.4],"proberadius":[0.1,0.2]},"uuid":"2a077c82-5671-4c22-b3cb-caff4979c644"},'
        r'"3":{"components":{"Mechanical Scrap":1,"Germanium":1,"Phase Alloys":1},"features":{"mass":[0.6,0.6],'
        r'"proberadius":[0.2,0.3]},"uuid":"081990f9-99d3-435a-9428-ad26471576de"},"4":{"components":{"Mechanical '
        r'Equipment":1,"Niobium":1,"Proto Light Alloys":1},"features":{"mass":[0.8,0.8],"proberadius":[0.3,0.4]},'
        r'"uuid":"aa10c84d-1409-48d5-ac02-d0a100d27555"},"5":{"components":{"Mechanical Components":1,"Tin":1,'
        r'"Proto Radiolic Alloys":1},"features":{"mass":[1,1],"proberadius":[0.4,0.5]},'
        r'"uuid":"ea7dfe28-95d0-4939-bcf2-282dbed7d80f\n"}},"id":93,"modulename":["Detailed surface scanner","DSS"],'
        r'"name":"Expanded Probe Scanning Radius","grade":5}},{"class":1,"rating":"D","enabled":true,"priority":1},'
        r'null]},"stats":{"class":3,"hullCost":141889930,"speed":180,"boost":240,"boostEnergy":27,'
        r'"baseShieldStrength":350,"baseArmour":525,"heatCapacity":334,"hardness":65,"hullMass":400,"masslock":23,'
        r'"pipSpeed":0.14,"fighterHangars":1,"pitch":25,"roll":60,"yaw":10,"crew":3,"reserveFuelCapacity":1.07,'
        r'"moduleCostMultiplier":1,"fuelCapacity":32,"cargoCapacity":96,"passengerCapacity":0,"ladenMass":688.5,'
        r'"armour":525,"shield":350,"shieldCells":0,"totalCost":291148294,"unladenMass":560.5,"totalDpe":0,'
        r'"totalAbsDpe":0,"totalExplDpe":0,"totalKinDpe":0,"totalThermDpe":0,"totalDps":0,"totalAbsDps":0,'
        r'"totalExplDps":0,"totalKinDps":0,"totalThermDps":0,"totalSDps":0,"totalAbsSDps":0,"totalExplSDps":0,'
        r'"totalKinSDps":0,"totalThermSDps":0,"totalEps":0,"totalHps":0,"shieldExplRes":0,"shieldKinRes":0,'
        r'"shieldThermRes":0,"hullExplRes":0,"hullKinRes":0,"hullThermRes":0,"topSpeed":181.5,"topBoost":242,'
        r'"topPitch":25.21,"topRoll":60.5,"topYaw":10.08,"unladenRange":49.03,"fullTankRange":47.48,'
        r'"ladenRange":42.33,"unladenFastestRange":192.99,"ladenFastestRange":171.59,"maxJumpCount":4}} '
    )
]