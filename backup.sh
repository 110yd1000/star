#!/bin/bash

# Debian 11 System Backup Script
# Backs up /etc, /home, and databases (MySQL/MariaDB, PostgreSQL)
# Author: System Administrator
# Version: 1.0

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
BACKUP_BASE_DIR="/backup"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE_DIR}/system_backup_${BACKUP_DATE}"
LOG_FILE="${BACKUP_DIR}/backup.log"
COMPRESS_LEVEL=6  # gzip compression level (1-9)
RETENTION_DAYS=30  # Keep backups for 30 days

# Database credentials (modify as needed)
MYSQL_USER="root"
MYSQL_PASSWORD=""  # Set password or use .my.cnf
POSTGRES_USER="postgres"

# Email notification (optional)
NOTIFY_EMAIL=""  # Set email address for notifications

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} - ${message}" | tee -a "${LOG_FILE}"
}

error_exit() {
    local message="$1"
    log "${RED}ERROR: ${message}${NC}"
    exit 1
}

success() {
    local message="$1"
    log "${GREEN}SUCCESS: ${message}${NC}"
}

warning() {
    local message="$1"
    log "${YELLOW}WARNING: ${message}${NC}"
}

info() {
    local message="$1"
    log "${BLUE}INFO: ${message}${NC}"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "This script must be run as root"
    fi
}

create_backup_directory() {
    echo -e "${BLUE}INFO: Creating backup directory: ${BACKUP_DIR}${NC}"
    mkdir -p "${BACKUP_DIR}" || {
        echo -e "${RED}ERROR: Failed to create backup directory${NC}"
        exit 1
    }
    chmod 700 "${BACKUP_DIR}"
    
    # Now that directory exists, we can start logging to file
    log "=== BACKUP STARTED ==="
    log "Backup directory: ${BACKUP_DIR}"
}

backup_etc() {
    info "Starting /etc backup..."
    local etc_backup="${BACKUP_DIR}/etc_backup.tar.gz"
    
    if tar -czf "${etc_backup}" -C / etc/ 2>>"${LOG_FILE}"; then
        success "/etc backup completed: ${etc_backup}"
        info "Size: $(du -h "${etc_backup}" | cut -f1)"
    else
        error_exit "Failed to backup /etc"
    fi
}

backup_home() {
    info "Starting /home backup..."
    local home_backup="${BACKUP_DIR}/home_backup.tar.gz"
    
    # Exclude common cache and temporary directories
    local exclude_patterns=(
        "--exclude=*/.cache/*"
        "--exclude=*/.thumbnails/*" 
        "--exclude=*/.local/share/Trash/*"
        "--exclude=*/Downloads/tmp/*"
        "--exclude=*/.mozilla/firefox/*/Cache/*"
        "--exclude=*/.config/google-chrome/*/Cache/*"
    )
    
    if tar -czf "${home_backup}" "${exclude_patterns[@]}" -C / home/ 2>>"${LOG_FILE}"; then
        success "/home backup completed: ${home_backup}"
        info "Size: $(du -h "${home_backup}" | cut -f1)"
    else
        error_exit "Failed to backup /home"
    fi
}

backup_mysql() {
    if ! command -v mysqldump &> /dev/null; then
        warning "MySQL/MariaDB not found, skipping database backup"
        return 0
    fi
    
    info "Starting MySQL/MariaDB backup..."
    local mysql_backup="${BACKUP_DIR}/mysql_backup.sql.gz"
    
    # Test MySQL connection
    if ! mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" -e "SHOW DATABASES;" &>/dev/null; then
        warning "Cannot connect to MySQL/MariaDB, skipping database backup"
        return 0
    fi
    
    # Backup all databases
    if mysqldump -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" \
        --all-databases \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --opt 2>>"${LOG_FILE}" | gzip > "${mysql_backup}"; then
        success "MySQL/MariaDB backup completed: ${mysql_backup}"
        info "Size: $(du -h "${mysql_backup}" | cut -f1)"
    else
        warning "Failed to backup MySQL/MariaDB databases"
    fi
}

backup_postgresql() {
    if ! command -v pg_dumpall &> /dev/null; then
        warning "PostgreSQL not found, skipping PostgreSQL backup"
        return 0
    fi
    
    info "Starting PostgreSQL backup..."
    local postgres_backup="${BACKUP_DIR}/postgresql_backup.sql.gz"
    
    # Test PostgreSQL connection
    if ! sudo -u "${POSTGRES_USER}" psql -c '\l' &>/dev/null; then
        warning "Cannot connect to PostgreSQL, skipping database backup"
        return 0
    fi
    
    # Backup all databases
    if sudo -u "${POSTGRES_USER}" pg_dumpall 2>>"${LOG_FILE}" | gzip > "${postgres_backup}"; then
        success "PostgreSQL backup completed: ${postgres_backup}"
        info "Size: $(du -h "${postgres_backup}" | cut -f1)"
    else
        warning "Failed to backup PostgreSQL databases"
    fi
}

create_system_info() {
    info "Collecting system information..."
    local sysinfo_file="${BACKUP_DIR}/system_info.txt"
    
    {
        echo "=== SYSTEM BACKUP INFORMATION ==="
        echo "Backup Date: $(date)"
        echo "Hostname: $(hostname -f)"
        echo "OS Version: $(cat /etc/os-release | grep PRETTY_NAME)"
        echo "Kernel: $(uname -r)"
        echo "Uptime: $(uptime)"
        echo ""
        echo "=== DISK USAGE ==="
        df -h
        echo ""
        echo "=== INSTALLED PACKAGES ==="
        dpkg --get-selections > "${BACKUP_DIR}/installed_packages.txt"
        echo "Package list saved to installed_packages.txt"
        echo ""
        echo "=== NETWORK CONFIGURATION ==="
        ip addr show
        echo ""
        echo "=== RUNNING SERVICES ==="
        systemctl list-units --type=service --state=running
    } > "${sysinfo_file}"
    
    success "System information collected: ${sysinfo_file}"
}

cleanup_old_backups() {
    info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    if [[ -d "${BACKUP_BASE_DIR}" ]]; then
        local deleted_count=$(find "${BACKUP_BASE_DIR}" -maxdepth 1 -type d -name "system_backup_*" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; -print | wc -l)
        if [[ ${deleted_count} -gt 0 ]]; then
            success "Deleted ${deleted_count} old backup(s)"
        else
            info "No old backups to clean up"
        fi
    fi
}

calculate_total_size() {
    local total_size=$(du -sh "${BACKUP_DIR}" | cut -f1)
    info "Total backup size: ${total_size}"
}

send_notification() {
    if [[ -n "${NOTIFY_EMAIL}" ]]; then
        local subject="System Backup Completed - $(hostname) - ${BACKUP_DATE}"
        local body="Backup completed successfully at ${BACKUP_DIR}\n\nTotal size: $(du -sh "${BACKUP_DIR}" | cut -f1)\n\nCheck log file for details: ${LOG_FILE}"
        
        if command -v mail &> /dev/null; then
            echo -e "${body}" | mail -s "${subject}" "${NOTIFY_EMAIL}"
            info "Notification sent to ${NOTIFY_EMAIL}"
        else
            warning "Mail command not available, skipping email notification"
        fi
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    echo -e "${BLUE}=== Debian 11 System Backup Script ===${NC}"
    echo -e "${BLUE}Started at: $(date)${NC}"
    echo ""
    
    # Preliminary checks
    check_root
    create_backup_directory
    
    # Perform backups
    info "Starting system backup process..."
    backup_etc
    backup_home
    backup_mysql
    backup_postgresql
    create_system_info
    
    # Cleanup and finalize
    cleanup_old_backups
    calculate_total_size
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    success "Backup completed successfully in ${duration} seconds"
    log "=== BACKUP COMPLETED ==="
    
    # Send notification if configured
    send_notification
    
    echo ""
    echo -e "${GREEN}Backup completed successfully!${NC}"
    echo -e "${GREEN}Location: ${BACKUP_DIR}${NC}"
    echo -e "${GREEN}Log file: ${LOG_FILE}${NC}"
}

# Handle script interruption
trap 'error_exit "Backup interrupted by user"' INT TERM

# Run main function
main "$@"