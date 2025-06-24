# Claude Security Configuration

## Overview

This document outlines the security configurations for Claude AI assistant when working on this project.

## Bash Command Restrictions

The `.claude/settings.local.json` file implements a deny-list to prevent execution of potentially dangerous commands:

### Explicitly Denied Commands

#### File System Operations
- `rm` - Prevents file/directory deletion
- `chmod` - Prevents permission changes
- `chown` - Prevents ownership changes
- `chgrp` - Prevents group ownership changes

#### Privilege Escalation
- `sudo` - Prevents superuser access
- `su` - Prevents user switching
- `visudo` - Prevents sudoers file editing

#### System Administration
- `dd` - Prevents disk operations
- `mkfs` - Prevents filesystem creation
- `mount/umount` - Prevents filesystem mounting
- `fdisk/parted` - Prevents disk partitioning
- `format` - Prevents formatting operations

#### System Control
- `shutdown/reboot/poweroff` - Prevents system control
- `systemctl/service` - Prevents service management
- `kill/killall/pkill` - Prevents process termination

#### User Management
- `passwd` - Prevents password changes
- `useradd/userdel/usermod` - Prevents user account changes
- `groupadd/groupdel` - Prevents group management

#### Network Operations
- `nc/netcat` - Prevents network connections
- `iptables` - Prevents firewall changes

### Allowed Operations

The following Git and filesystem operations remain allowed for development:
- `git` operations (add, commit, push, checkout, config)
- `ls` - Directory listing
- `mv` - File moving/renaming
- `find` - File searching

## Implementation

To use these security settings:

1. Copy the example configuration:
   ```bash
   cp .claude/settings.example.json .claude/settings.local.json
   ```

2. The deny-list will automatically prevent execution of dangerous commands

3. Additional commands can be added to either the allow or deny lists as needed

## Rationale

This configuration follows the principle of least privilege, allowing only the commands necessary for development work while explicitly blocking commands that could:
- Delete or damage files
- Escalate privileges
- Modify system settings
- Compromise security
- Affect system stability

## Updates

When updating the security configuration:
1. Update `.claude/settings.example.json`
2. Document the change in this file
3. Ensure all team members update their local settings