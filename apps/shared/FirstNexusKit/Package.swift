// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "FirstNexusKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "FirstNexusProtocol", targets: ["FirstNexusProtocol"]),
        .library(name: "FirstNexusKit", targets: ["FirstNexusKit"]),
        .library(name: "FirstNexusChatUI", targets: ["FirstNexusChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.1"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "FirstNexusProtocol",
            path: "Sources/FirstNexusProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FirstNexusKit",
            dependencies: [
                "FirstNexusProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/FirstNexusKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FirstNexusChatUI",
            dependencies: [
                "FirstNexusKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/FirstNexusChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "FirstNexusKitTests",
            dependencies: ["FirstNexusKit", "FirstNexusChatUI"],
            path: "Tests/FirstNexusKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
