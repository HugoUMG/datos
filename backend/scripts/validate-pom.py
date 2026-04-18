#!/usr/bin/env python3
import sys
import xml.etree.ElementTree as ET

path = 'pom.xml'
try:
    ET.parse(path)
    print('POM XML OK')
except ET.ParseError as ex:
    print(f'POM XML INVALID: {ex}')
    sys.exit(1)
