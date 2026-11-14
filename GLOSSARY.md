# Læsehjælper

Terms for preparing photographed book pages for reading.

## Photo preparation

**Photo acceptance**:
An adult's confirmation that a prepared photo belongs as a page in its originating book. Acceptance is distinct from a successful save on the device.
_Avoid_: Save confirmation

**Unsaved page**:
A page whose latest write to device storage failed. It stays attached to its book for the session and can be retried; it does not survive a reload.
_Avoid_: Lost page, draft page

**Photo batch**:
A group of photos selected together for preparation in one book. A batch can contain accepted photos and photos that have not yet been accepted.


## Storage

**Library**:
The books and pages kept on this device, together with what has not reached device storage yet. Implemented by `src/library.ts`.
_Avoid_: Repository, database (for the concept)
