SpiceFS
========
Metadadata for any Filesystem

[TOC]

----------

SpiceFS (**Spice File System** Extension) is a *node.js module* for extending files and especially directories with custom metadata, by adding metadata *subdirectories* and *-files*.

----------


Basic Concept
--------------------
The basic concept of SpiceFS is to create a **.spice** directory inside the directory that is the target of extension, or contains the target files to be extended.

> By design, SpiceFS is more suited to directories, as a copy of the whole directory would
> automatically include a copy of it's metadata.

### Structure on FileSystem ###
The spice directory contains a **spice.repository** file, containing a *BSON* representation of the so called **spice repository** (the metadata). Each spice repository, short **repo**, contains a unique id, and other general data in a container called the **public rack**.
Additionally, there are **protected** and **private** racks, linked to the specific user who created them. These racks are stored in files nearby the repo file, in files called **_USERID_.spice.rack**.

----------

API
-------

### DirectoryRef
Represents a reference to a filesystem directory.

Path
: readonly *string*
: The path of this directory on the filesystem *(given by OS)*

DirectoryRef.load(*string* path, callback)
: Static
: Tries to open a directory at the given path.
: The callback receives two arguments *(err, directoryRef)*

### Repository
Represents a **Spice Repository**

repository.ID
: readonly *string*
: A globally (nearly) unique ID, generated freshly on repository generation.

repository.Directory
: readonly *DirectoryRef*
: The directory this repository is made for.

repository.Path
: readonly *string*
: The filesystem path to the *.spice* directory.

repository.IsNew
: readonly *bool* 
: Is true, if this repo only exists in memory until now (i.e. was not loaded from, or saved to disk).

repository.save(callback)
: Write the metadata to the filesystem. Serializes all linked racks, ignoring readonly racks.
: > Because repository.save() just overwrites any file with the new data, avoid opening multiple repositories at the same ime, as they would not merge their changes on disk.
: The callback gets two arguments *(err, repository)*.

repository.purge(callback)
: Deletes the complete *.spices* directory from the filesystem and purges all metadata.
: The callback gets one argument *(err)*.

repository.openPublicRack(callback)
: Tries to open (or create) a public rack of this repository. Beware that the public rack is completely unprotected.
: The callback gets two arguments *(err, publicRack)*
: > Opening a rack always means to open the **current** version of it on the filesystem. This could mean inconsistencies between multiple, different 'open' calls, if the filesystem has been updated in between.

repository.openProtectedRackOf(userid, keychain, callback)
: Tries to open (or create) a protected rack of the given userid. Uses the keychain to try out various keys and determine read/write access.
: The callback gets two arguments *(err, protectedRack)*, whereas the protectedRack will be null, if no read-access key (publicKey) was found in the keyChain. If no write-access key is found, the rack would be set in readonly mode (they cannot be saved). The newest keypair on the keychain will automatically be infused on the rack, so no keychain is needed for the save workflow.
: > If the newest keypair contains no write-key, the newest keypair that is at least as young as the keypair used to open rack is used. If there is none with a write key, the upper rule applies, and saving of this rack will be impossible.

repository.openPrivateRackOf(userid, keychain, callback)
: Tries to open (or create) a rack of the given userid. Uses the keychain to try out various keys and determine read/write access.
: The callback gets two arguments *(err, privateRack)*, whereas the privateRack will be null, if not both, the read-access (publicKey) and the write-access key (privateKey) were found in the keyChain. The newest keypair on the keychain will automatically be infused on the racks, so no keychain is needed for their respective save workflow.

repository.openRacksOf(userid, keychain, callback)
: Combines repository.openPrivateRackOf() and repository.openProtectedRackOf().
: The callback gets three arguments *(err, protectedRack, privateRack)* to which the upper described rules apply.

Repository.openAt(*string* path, callback)
: Static
: Opens a directory and creates or loads a repository for this directory.
: The callback gets two arguments *(err, repository)* whereas repository will be **null** if the directory could not be loaded.

### Rack
Represents a **Spice Rack** which contain actual metadata. Can only be obtained through the open..() methods of a repository.

rack.UserID
: readonly *string|null*
: The UserID this rack belongs to. (null if none)

rack.ReadOnly
: readonly *bool*
: True, if the repository.save() method would ignore this rack and the Spices member would be sealed.

rack.Repository
: readonly *Repository*
: The parent repository this rack belongs to

rack.Spices
: [readonly] *Object*
: Plain javascript object, containing the actual data. This object will be sealed if the rack is ReadOnly