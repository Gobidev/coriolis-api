from test_ship_builds import test_ships
import requests
import json


def convert_with_api(loadout_event: str) -> str:
    answer = requests.post("http://localhost:7777/convert", json=json.loads(loadout_event))
    return answer.text


if __name__ == '__main__':
    for test_ship in test_ships:
        print("\n")

        print("Testing ship", test_ship.test_reason)
        converted_build = convert_with_api(test_ship.loadout_event)
        print("Got answer:", converted_build)
        print("Expected answer:", test_ship.expected_result)
        if json.loads(converted_build) == json.loads(test_ship.expected_result):
            print("Conversion was successful")
        else:
            print("Got unexpected answer")
