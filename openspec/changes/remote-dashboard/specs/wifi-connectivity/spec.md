## ADDED Requirements

### Requirement: Wi-Fi station mode
The ESP32 SHALL connect to a home Wi-Fi network in station mode using credentials defined in the firmware configuration.

#### Scenario: Successful connection on boot
- **WHEN** the ESP32 boots with valid SSID and password configured
- **THEN** the ESP32 SHALL connect to the Wi-Fi network and print its IP address to serial

#### Scenario: Connection failure
- **WHEN** the ESP32 cannot connect to the configured network within 10 seconds
- **THEN** the ESP32 SHALL print an error to serial and retry every 5 seconds

#### Scenario: Reconnection after drop
- **WHEN** the Wi-Fi connection drops while the system is running
- **THEN** the ESP32 SHALL attempt to reconnect automatically and continue the current shake cycle uninterrupted

### Requirement: Wi-Fi credentials configuration
The firmware SHALL read Wi-Fi credentials from a `wifi_credentials.h` file that is excluded from version control via `.gitignore`.

#### Scenario: Credentials file exists
- **WHEN** `include/wifi_credentials.h` defines `WIFI_SSID` and `WIFI_PASSWORD`
- **THEN** the firmware SHALL compile and use those credentials for Wi-Fi connection

#### Scenario: Credentials file missing
- **WHEN** `include/wifi_credentials.h` does not exist
- **THEN** the firmware SHALL fail to compile with a clear error indicating the file is missing

### Requirement: mDNS hostname
The ESP32 SHALL register an mDNS hostname so the backend can discover it without knowing its IP address.

#### Scenario: mDNS registration
- **WHEN** the ESP32 connects to Wi-Fi
- **THEN** it SHALL register the mDNS hostname `digi-shaker` so it is reachable at `digi-shaker.local`
