import main_js_api_code
import json
import os

main_files = [
    "./coriolis/src/app/utils/JournalUtils.js",
    "./coriolis/src/app/utils/CompanionApiUtils.js",
    "./coriolis/src/app/utils/BlueprintFunctions.js",
    "./coriolis/src/app/utils/UtilityFunctions.js",
    "./coriolis/src/app/utils/UrlGenerators.js",

    "./coriolis/src/app/shipyard/Ship.js",
    "./coriolis/src/app/shipyard/Module.js",
    "./coriolis/src/app/shipyard/Calculations.js",
    "./coriolis/src/app/shipyard/ModuleUtils.js",
    "./coriolis/src/app/shipyard/ModuleSet.js",
    "./coriolis/src/app/shipyard/StatsFormatting.js",
    "./coriolis/src/app/shipyard/Serializer.js",
    "./coriolis/src/app/shipyard/Constants.js",
]

replacement_dict = {
    "JournalUtils.": "",
    "CompanionApiUtils.": "",
    "BlueprintFunctions.": "",
    "UtilityFunctions.": "",
    "UrlGenerators.": "",
    "Ship.": "",
    "Module.": "",
    "Calculations.": "",
    "Calc.": "",
    "ModuleUtils.": "",
    "ModuleSet.": "",
    "StatsFormatting.": "",
    "Serializer.": "",
    "Constants.": "",

    "export ": "",
    "default ": "",

    "Modifications.": "Dist.Modifications.",
    "Modifications[": "Dist.Modifications[",
    "Ships.": "Dist.Ships.",
    "Ships[": "Dist.Ships[",
    "Modules.": "Dist.Modules.",
    "Modules[": "Dist.Modules[",
    "Modules,": "Dist.Modules,",
    '"Dist.Modules"': '"Modules"',

    "json.Dist.Modules.": "json.Modules.",

    "_.": "Lodash.",
    "chain(": "Lodash.chain(",

    "this.jumpRange(": "jumpRange(",
}


def parse_file(filename: str) -> str:
    with open(filename, "r") as f:
        parsed_file = f.read()

    # Apply replacement_dict
    for item in replacement_dict:
        parsed_file = parsed_file.replace(item, replacement_dict[item])

    # Split lines
    file_lines = parsed_file.split("\n")

    # Remove all imports
    for index, line in enumerate(file_lines):
        if line.startswith("import ") or line.startswith("const zlib"):
            file_lines[index] = ""

    # Remove double empty lines
    for index, line in enumerate(file_lines):
        if index < len(file_lines) - 1:
            if line == "" and file_lines[index + 1] == "":
                del file_lines[index]

    # Insert filename
    file_lines.insert(0, f"\n\n//------------------------------------------------\n//{filename}")

    # Recombine lines
    parsed_file = "\n".join(file_lines)

    # Remove redundant methods
    file_methods = parsed_file.split("/**")
    indicator_strings = ["<span>", "div>", "</tr>"]

    for index, method in enumerate(file_methods):
        for indicator in indicator_strings:
            if indicator in method:
                del file_methods[index]

    parsed_file = "/**".join(file_methods)

    return parsed_file


def generate_api_file() -> str:
    output_string = main_js_api_code.api_constant_imports

    for file in main_files:
        output_string += parse_file(file)

    output_string += main_js_api_code.main_api_js

    return output_string


if __name__ == '__main__':
    api_file_string = generate_api_file()
    with open("index.js", "w") as api_file:
        api_file.write(api_file_string)
    print("API built successfully!")
