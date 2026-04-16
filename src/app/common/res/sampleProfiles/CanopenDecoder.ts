import {ProfileProperty} from "../../model/profile/Profile";
import {SCHEMA_VERSION} from "../../../../Version";
import {InterfaceType} from "../../model/profile/Interface";
import {ChannelType} from "../../model/profile/Channel";
import {CompareDataType, CustomPropertyType, ElementType, IOParameterType, RenderModeType} from "../../model/profile/Common";
import {HtmlComponentDefinitionFramework, HtmlEmbeddedComponentNames} from "../../model/profile/Html";
import {LayoutType, ViewFragmentType, ViewType} from "../../model/profile/View";
import {LayerType} from "../../model/profile/Layer";
import {defaultStyles, embeddedRef, localRef} from "./sampleHelpers";
 
/* ──────────────────────────────────────────────────────
 * CANopen Decoder Layer
 *
 * Input:  data (Uint8Array - raw CAN payload)
 *         Available via _origin.can.*: id, hex_id, dlc, rtr, ext, fd
 *
 * Output: typeClass - stable CSS/filter class (NMT, SYNC, TIME, TPDO, RPDO, SDO_REQ, SDO_RES, HEARTBEAT, ...)
 *         family    - protocol family (NMT, SYNC, TIME, PDO, SDO, HEARTBEAT, EMCY, UNKNOWN)
 *         label     - human label shown in the row badge
 *         nodeId    - actual CANopen node ID, or -1 if the frame is not node-specific
 *         nodeText  - formatted node description (Node 5, All nodes, Bus)
 *         cobId     - padded COB-ID hex string
 *         direction - semantic direction/role on the CANopen network
 *         service   - decoded service name within the family
 *         pdoNumber - PDO number for TPDO/RPDO frames
 *         index     - SDO object index, or -1 when not applicable
 *         subIndex  - SDO object sub-index, or -1 when not applicable
 *         summary   - plain-language explanation of the frame meaning
 *         detail    - secondary protocol detail, including important control-byte bits
 *         hexData   - raw payload as hex string
 *         raw       - original data (Uint8Array passthrough)
 * ────────────────────────────────────────────────────── */
const canopenDecoderLayer = `function middleware(ctx, accumulator, input, next, throwException, props) {
    var originCan = input && input._origin ? input._origin.can : null;
    var canId = originCan && typeof originCan.id === 'number' ? originCan.id : 0;
    var dlc = originCan && typeof originCan.dlc === 'number' ? originCan.dlc : (input && input.data ? input.data.length : 0);
    var rtr = originCan ? !!originCan.rtr : false;
    var ext = originCan ? !!originCan.ext : false;
    var fd = originCan ? !!originCan.fd : false;
    var d = input && input.data ? input.data : new Uint8Array(0);
    var acc = accumulator && accumulator.sdoSessions ? accumulator : {sdoSessions: {}};
 
    function toHex(value, width) {
        var out = (value >>> 0).toString(16).toUpperCase();
        while (out.length < width) out = '0' + out;
        return out;
    }
 
    function padNumber(value, width) {
        var out = String(value);
        while (out.length < width) out = '0' + out;
        return out;
    }
 
    function byteAt(index) {
        return index < d.length ? d[index] : 0;
    }
 
    function leUint16(offset) {
        return byteAt(offset) | (byteAt(offset + 1) << 8);
    }
 
    function leUint32(offset) {
        return ((byteAt(offset)) | (byteAt(offset + 1) << 8) | (byteAt(offset + 2) << 16) | (byteAt(offset + 3) << 24)) >>> 0;
    }
 
    function yesNo(flag) {
        return flag ? 'yes' : 'no';
    }
 
    function formatCobId(id) {
        return '0x' + toHex(id, ext || id > 0x7FF ? 8 : 3);
    }
 
    function formatNodeText(id, allowBroadcast) {
        if (id < 0) return 'Bus';
        if (allowBroadcast && id === 0) return 'All nodes';
        return 'Node ' + id;
    }
 
    function formatObjectKey(index, subIndex) {
        if (index < 0 || subIndex < 0) return 'unknown object';
        return '0x' + toHex(index, 4) + ':' + toHex(subIndex, 2);
    }
 
    function formatTimeOfDay(milliseconds) {
        var hours = Math.floor(milliseconds / 3600000) % 24;
        var minutes = Math.floor(milliseconds / 60000) % 60;
        var seconds = Math.floor(milliseconds / 1000) % 60;
        var ms = milliseconds % 1000;
        return padNumber(hours, 2) + ':' + padNumber(minutes, 2) + ':' + padNumber(seconds, 2) + '.' + padNumber(ms, 3);
    }
 
    function formatDateFromEpoch(days, milliseconds) {
        var date = new Date(Date.UTC(1984, 0, 1) + days * 86400000 + milliseconds);
        return date.getUTCFullYear() + '-' + padNumber(date.getUTCMonth() + 1, 2) + '-' + padNumber(date.getUTCDate(), 2);
    }
 
    function sliceHex(start, count) {
        var parts = [];
        var end = Math.min(d.length, start + count);
        for (var i = start; i < end; i++) parts.push(toHex(d[i], 2));
        return parts.join(' ');
    }
 
    function appendTransportFlags(detailText) {
        var flags = [];
        if (rtr) flags.push('RTR');
        if (ext) flags.push('EXT');
        if (fd) flags.push('FD');
        if (!flags.length) return detailText;
        return (detailText ? detailText + ' | ' : '') + 'Transport flags=' + flags.join(', ');
    }
 
    function abortDescription(code) {
        var abortMap = {
            0x05030000: 'Toggle bit not alternated',
            0x05040000: 'SDO protocol timed out',
            0x05040001: 'Client/server command specifier not valid',
            0x05040002: 'Invalid block size',
            0x05040003: 'Invalid sequence number',
            0x05040004: 'CRC error',
            0x05040005: 'Out of memory',
            0x06010000: 'Unsupported access to an object',
            0x06010001: 'Attempt to read a write-only object',
            0x06010002: 'Attempt to write a read-only object',
            0x06020000: 'Object does not exist',
            0x06040041: 'Object cannot be mapped to a PDO',
            0x06040042: 'Mapped PDO would exceed PDO length',
            0x06040043: 'General parameter incompatibility',
            0x06040047: 'General internal incompatibility',
            0x06060000: 'Access failed due to hardware error',
            0x06070010: 'Data type mismatch or length mismatch',
            0x06070012: 'Data type mismatch, length too high',
            0x06070013: 'Data type mismatch, length too low',
            0x06090011: 'Sub-index does not exist',
            0x06090030: 'Invalid value range',
            0x06090031: 'Value too high',
            0x06090032: 'Value too low',
            0x06090036: 'Maximum less than minimum',
            0x08000000: 'General error',
            0x08000020: 'Data cannot be transferred or stored',
            0x08000021: 'Local control prevents transfer',
            0x08000022: 'Device state prevents transfer',
            0x08000023: 'Object dictionary is missing'
        };
        return abortMap[code] || 'Unknown abort reason';
    }
 
    function getSdoSession(nodeId) {
        return acc.sdoSessions[String(nodeId)] || null;
    }
 
    function setSdoSession(nodeId, session) {
        acc.sdoSessions[String(nodeId)] = session;
        return session;
    }
 
    function clearSdoSession(nodeId) {
        delete acc.sdoSessions[String(nodeId)];
    }
 
    function resolveIndex(session, fallback) {
        return session && typeof session.index === 'number' && session.index >= 0 ? session.index : fallback;
    }
 
    function resolveSubIndex(session, fallback) {
        return session && typeof session.subIndex === 'number' && session.subIndex >= 0 ? session.subIndex : fallback;
    }
 
    function resolveObjectKey(session, fallbackIndex, fallbackSubIndex) {
        return formatObjectKey(resolveIndex(session, fallbackIndex), resolveSubIndex(session, fallbackSubIndex));
    }
 
    function rememberUploadRequest(nodeId, index, subIndex) {
        return setSdoSession(nodeId, {
            mode: 'await-upload-init',
            transferDirection: 'upload',
            dataSender: 'server',
            index: index,
            subIndex: subIndex,
            declaredSize: -1,
            pendingFinalSegment: false,
            phase: 'await-init-response'
        });
    }
 
    function startSdoSession(nodeId, mode, transferDirection, index, subIndex, declaredSize) {
        return setSdoSession(nodeId, {
            mode: mode,
            transferDirection: transferDirection,
            dataSender: transferDirection === 'upload' ? 'server' : 'client',
            index: index,
            subIndex: subIndex,
            declaredSize: declaredSize,
            pendingFinalSegment: false,
            phase: 'await-init-response'
        });
    }
 
    function isBlockDataFrame(session, frameIsResponse, commandByte) {
        if (!session || session.mode !== 'block') return false;
        if (session.phase !== 'transfer' && session.phase !== 'await-final-ack') return false;
        if ((frameIsResponse ? 'server' : 'client') !== session.dataSender) return false;
        return (commandByte & 0x7F) >= 1;
    }
 
    var hexData = sliceHex(0, d.length);
    var result = {
        typeClass: 'UNKNOWN',
        family: 'UNKNOWN',
        label: 'Unknown',
        nodeId: -1,
        nodeText: 'Bus',
        cobId: formatCobId(canId),
        direction: 'Bus',
        service: 'Unknown frame',
        pdoNumber: 0,
        index: -1,
        subIndex: -1,
        summary: 'Unrecognized CANopen frame.',
        detail: hexData,
        hexData: hexData,
        raw: d
    };
 
    function setResult(typeClass, family, label, nodeId, nodeText, direction, service, pdoNumber, index, subIndex, summary, detail) {
        result.typeClass = typeClass;
        result.family = family;
        result.label = label;
        result.nodeId = nodeId;
        result.nodeText = nodeText;
        result.direction = direction;
        result.service = service;
        result.pdoNumber = pdoNumber;
        result.index = index;
        result.subIndex = subIndex;
        result.summary = summary;
        result.detail = detail;
    }
 
    function decodeSdo(nodeId, isResponse) {
        var command = byteAt(0);
        var spec = (command >> 5) & 0x07;
        var index = dlc >= 3 ? leUint16(1) : -1;
        var subIndex = dlc >= 4 ? byteAt(3) : -1;
        var session = getSdoSession(nodeId);
        var emittedIndex = resolveIndex(session, index);
        var emittedSubIndex = resolveSubIndex(session, subIndex);
        var objectKey = resolveObjectKey(session, index, subIndex);
        var direction = isResponse ? 'Server->Client' : 'Client->Server';
        var label = isResponse ? 'SDO Response' : 'SDO Request';
        var typeClass = isResponse ? 'SDO_RES' : 'SDO_REQ';
        var service = isResponse ? 'Response' : 'Request';
        var summary = 'SDO transfer for ' + objectKey + '.';
        var detail = 'Command 0x' + toHex(command, 2) + '.';
 
        if (isBlockDataFrame(session, isResponse, command)) {
            var blockSeq = command & 0x7F;
            var blockFinal = (command & 0x80) !== 0;
            var blockPayload = sliceHex(1, Math.max(0, dlc - 1));
            service = session.transferDirection === 'upload' ? 'Block upload segment' : 'Block download segment';
            summary = (blockFinal ? 'Final' : 'Intermediate') + ' block segment ' + blockSeq + ' carrying data for ' + objectKey + (session.transferDirection === 'upload' ? ' from node ' + nodeId + '.' : ' to node ' + nodeId + '.');
            detail = 'Command 0x' + toHex(command, 2) + ': seq=' + blockSeq + ', final=' + yesNo(blockFinal) + ', data=' + blockPayload + (blockFinal ? ', tail padding is declared in the end-block frame.' : '.');
            if (blockFinal) session.phase = 'await-final-ack';
            setResult(typeClass, 'SDO', label, nodeId, formatNodeText(nodeId, false), direction, service, 0, emittedIndex, emittedSubIndex, summary, detail);
            return;
        }
 
        if (command === 0x80) {
            var abortCode = dlc >= 8 ? leUint32(4) : 0;
            service = 'Abort transfer';
            summary = (isResponse ? 'Node ' + nodeId + ' aborted' : 'Client aborted') + ' the SDO transfer for ' + objectKey + '.';
            detail = 'Command 0x' + toHex(command, 2) + ': abort transfer, code=0x' + toHex(abortCode, 8) + ' ' + abortDescription(abortCode) + '.';
            clearSdoSession(nodeId);
            setResult(typeClass, 'SDO', label, nodeId, formatNodeText(nodeId, false), direction, service, 0, emittedIndex, emittedSubIndex, summary, detail);
            return;
        }
 
        if (!isResponse) {
            if (spec === 0) {
                var downToggle = (command >> 4) & 0x01;
                var downUnused = (command >> 1) & 0x07;
                var downLast = (command & 0x01) === 1;
                var downBytes = Math.max(0, Math.min(downLast ? 7 - downUnused : 7, dlc - 1));
                service = 'Download segment request';
                summary = objectKey !== 'unknown object'
                    ? (downLast ? 'Final' : 'Intermediate') + ' segmented download for ' + objectKey + ' to node ' + nodeId + ' with ' + downBytes + ' data byte(s).'
                    : (downLast ? 'Final' : 'Intermediate') + ' segmented download to node ' + nodeId + ' with ' + downBytes + ' data byte(s).';
                detail = 'Command 0x' + toHex(command, 2) + ': toggle=' + downToggle + ', last=' + yesNo(downLast) + (downLast ? ', unused=' + downUnused : '') + ', data=' + sliceHex(1, downBytes) + '.';
                if (session && session.mode === 'segmented' && session.transferDirection === 'download') session.pendingFinalSegment = downLast;
            }
            else if (spec === 1) {
                var downloadExpedited = (command & 0x02) !== 0;
                var downloadSize = (command & 0x01) !== 0;
                var downloadUnused = (command >> 2) & 0x03;
                service = 'Initiate download request';
                if (downloadExpedited) {
                    var downloadBytes = downloadSize ? Math.max(0, 4 - downloadUnused) : Math.max(0, Math.min(4, dlc - 4));
                    summary = 'Client writes ' + downloadBytes + ' byte(s) to ' + objectKey + ' on node ' + nodeId + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': initiate download request, expedited=' + yesNo(downloadExpedited) + ', size=' + yesNo(downloadSize) + ', unused=' + downloadUnused + ', data=' + sliceHex(4, downloadBytes) + '.';
                    clearSdoSession(nodeId);
                }
                else {
                    var declaredSize = downloadSize && dlc >= 8 ? leUint32(4) : -1;
                    session = startSdoSession(nodeId, 'segmented', 'download', index, subIndex, declaredSize);
                    emittedIndex = session.index;
                    emittedSubIndex = session.subIndex;
                    objectKey = resolveObjectKey(session, index, subIndex);
                    summary = 'Client starts a segmented download to ' + objectKey + ' on node ' + nodeId + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': initiate download request, expedited=' + yesNo(downloadExpedited) + ', size=' + yesNo(downloadSize) + (declaredSize >= 0 ? ', declaredSize=' + declaredSize + ' byte(s).' : '.');
                }
            }
            else if (spec === 2) {
                service = 'Initiate upload request';
                session = rememberUploadRequest(nodeId, index, subIndex);
                emittedIndex = session.index;
                emittedSubIndex = session.subIndex;
                objectKey = resolveObjectKey(session, index, subIndex);
                summary = 'Client requests object ' + objectKey + ' from node ' + nodeId + '.';
                detail = 'Command 0x' + toHex(command, 2) + ': initiate upload request.';
            }
            else if (spec === 3) {
                var upReqToggle = (command >> 4) & 0x01;
                service = 'Upload segment request';
                summary = objectKey !== 'unknown object'
                    ? 'Client requests the next upload segment for ' + objectKey + ' from node ' + nodeId + '.'
                    : 'Client requests the next upload segment from node ' + nodeId + '.';
                detail = 'Command 0x' + toHex(command, 2) + ': upload segment request, toggle=' + upReqToggle + '.';
            }
            else if (spec === 5) {
                if (session && session.mode === 'block' && session.transferDirection === 'upload') {
                    objectKey = resolveObjectKey(session, index, subIndex);
                    emittedIndex = resolveIndex(session, index);
                    emittedSubIndex = resolveSubIndex(session, subIndex);
                    if (session.phase === 'await-start') {
                        service = 'Block upload start';
                        summary = 'Client started block upload for ' + objectKey + ' from node ' + nodeId + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': start block upload, subcommand=' + (command & 0x03) + '.';
                        session.phase = 'transfer';
                    }
                    else if (session.phase === 'transfer' || session.phase === 'await-final-ack') {
                        var upAckSeq = dlc >= 2 ? byteAt(1) : -1;
                        var upNextBlockSize = dlc >= 3 ? byteAt(2) : -1;
                        service = 'Block upload ACK';
                        summary = 'Client acknowledged block upload data for ' + objectKey + ' from node ' + nodeId + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block upload acknowledge' + (upAckSeq >= 0 ? ', ackSeq=' + upAckSeq : '') + (upNextBlockSize >= 0 ? ', nextBlockSize=' + upNextBlockSize : '') + '.';
                        if (session.phase === 'await-final-ack') session.phase = 'await-end';
                    }
                    else if (session.phase === 'await-end-response') {
                        service = 'Block upload end response';
                        summary = 'Client confirmed completion of block upload for ' + objectKey + ' from node ' + nodeId + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block upload end response.';
                        clearSdoSession(nodeId);
                    }
                    else {
                        service = 'Block upload request';
                        summary = 'Client issued a block upload control frame for ' + objectKey + ' on node ' + nodeId + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block upload control, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                    }
                }
                else {
                    session = startSdoSession(nodeId, 'block', 'upload', index, subIndex, -1);
                    emittedIndex = session.index;
                    emittedSubIndex = session.subIndex;
                    objectKey = resolveObjectKey(session, index, subIndex);
                    service = 'Block upload request';
                    summary = 'Client requested block upload of ' + objectKey + ' from node ' + nodeId + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': initiate block upload request, trailer=' + (dlc > 4 ? sliceHex(4, d.length - 4) : 'none') + '.';
                }
            }
            else if (spec === 6) {
                if (session && session.mode === 'block' && session.transferDirection === 'download' && session.phase === 'await-end') {
                    objectKey = resolveObjectKey(session, index, subIndex);
                    emittedIndex = resolveIndex(session, index);
                    emittedSubIndex = resolveSubIndex(session, subIndex);
                    service = 'Block download end';
                    summary = 'Client finished block download for ' + objectKey + ' to node ' + nodeId + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': block download end, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                    session.phase = 'await-end-response';
                }
                else {
                    session = startSdoSession(nodeId, 'block', 'download', index, subIndex, -1);
                    emittedIndex = session.index;
                    emittedSubIndex = session.subIndex;
                    objectKey = resolveObjectKey(session, index, subIndex);
                    service = 'Block download request';
                    summary = 'Client requested block download to ' + objectKey + ' on node ' + nodeId + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': initiate block download request, trailer=' + (dlc > 4 ? sliceHex(4, d.length - 4) : 'none') + '.';
                }
            }
            else {
                service = 'Reserved request';
                summary = 'Client sent a reserved SDO request to node ' + nodeId + '.';
                detail = 'Command 0x' + toHex(command, 2) + ': unsupported request specifier=' + spec + '.';
            }
        }
        else {
            if (spec === 0) {
                var upResToggle = (command >> 4) & 0x01;
                var upResUnused = (command >> 1) & 0x07;
                var upResLast = (command & 0x01) === 1;
                var upResBytes = Math.max(0, Math.min(upResLast ? 7 - upResUnused : 7, dlc - 1));
                service = 'Upload segment response';
                summary = objectKey !== 'unknown object'
                    ? (upResLast ? 'Final' : 'Intermediate') + ' upload segment for ' + objectKey + ' from node ' + nodeId + ' with ' + upResBytes + ' data byte(s).'
                    : (upResLast ? 'Final' : 'Intermediate') + ' upload segment from node ' + nodeId + ' with ' + upResBytes + ' data byte(s).';
                detail = 'Command 0x' + toHex(command, 2) + ': toggle=' + upResToggle + ', last=' + yesNo(upResLast) + (upResLast ? ', unused=' + upResUnused : '') + ', data=' + sliceHex(1, upResBytes) + '.';
                if (upResLast) clearSdoSession(nodeId);
            }
            else if (spec === 1) {
                var downAckToggle = (command >> 4) & 0x01;
                service = 'Download segment ACK';
                summary = objectKey !== 'unknown object'
                    ? 'Node ' + nodeId + ' acknowledged the previous download segment for ' + objectKey + '.'
                    : 'Node ' + nodeId + ' acknowledged the previous download segment.';
                detail = 'Command 0x' + toHex(command, 2) + ': download segment acknowledge, toggle=' + downAckToggle + '.';
                if (session && session.mode === 'segmented' && session.transferDirection === 'download' && session.pendingFinalSegment) clearSdoSession(nodeId);
            }
            else if (spec === 2) {
                var uploadExpedited = (command & 0x02) !== 0;
                var uploadSize = (command & 0x01) !== 0;
                var uploadUnused = (command >> 2) & 0x03;
                service = 'Initiate upload response';
                if (uploadExpedited) {
                    var uploadBytes = uploadSize ? Math.max(0, 4 - uploadUnused) : Math.max(0, Math.min(4, dlc - 4));
                    summary = 'Node ' + nodeId + ' returned ' + uploadBytes + ' byte(s) from ' + objectKey + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': initiate upload response, expedited=' + yesNo(uploadExpedited) + ', size=' + yesNo(uploadSize) + ', unused=' + uploadUnused + ', data=' + sliceHex(4, uploadBytes) + '.';
                    clearSdoSession(nodeId);
                }
                else {
                    var uploadDeclaredSize = uploadSize && dlc >= 8 ? leUint32(4) : -1;
                    session = startSdoSession(nodeId, 'segmented', 'upload', index, subIndex, uploadDeclaredSize);
                    emittedIndex = session.index;
                    emittedSubIndex = session.subIndex;
                    objectKey = resolveObjectKey(session, index, subIndex);
                    summary = 'Node ' + nodeId + ' started a segmented upload from ' + objectKey + '.';
                    detail = 'Command 0x' + toHex(command, 2) + ': initiate upload response, expedited=' + yesNo(uploadExpedited) + ', size=' + yesNo(uploadSize) + (uploadDeclaredSize >= 0 ? ', declaredSize=' + uploadDeclaredSize + ' byte(s).' : '.');
                }
            }
            else if (spec === 3) {
                service = 'Initiate download response';
                summary = 'Node ' + nodeId + ' accepted the write request for ' + objectKey + '.';
                detail = 'Command 0x' + toHex(command, 2) + ': initiate download response / ACK.';
            }
            else if (spec === 5) {
                if (session && session.mode === 'block' && session.transferDirection === 'download') {
                    objectKey = resolveObjectKey(session, index, subIndex);
                    emittedIndex = resolveIndex(session, index);
                    emittedSubIndex = resolveSubIndex(session, subIndex);
                    if (session.phase === 'await-init-response') {
                        service = 'Block download response';
                        summary = 'Node ' + nodeId + ' accepted block download for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block download response, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                        session.phase = 'transfer';
                    }
                    else if (session.phase === 'transfer' || session.phase === 'await-final-ack') {
                        var downAckSeq = dlc >= 2 ? byteAt(1) : -1;
                        var downNextBlockSize = dlc >= 3 ? byteAt(2) : -1;
                        service = 'Block download ACK';
                        summary = 'Node ' + nodeId + ' acknowledged block download data for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block download acknowledge' + (downAckSeq >= 0 ? ', ackSeq=' + downAckSeq : '') + (downNextBlockSize >= 0 ? ', nextBlockSize=' + downNextBlockSize : '') + '.';
                        if (session.phase === 'await-final-ack') session.phase = 'await-end';
                    }
                    else if (session.phase === 'await-end-response') {
                        service = 'Block download end response';
                        summary = 'Node ' + nodeId + ' confirmed completion of block download for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block download end response.';
                        clearSdoSession(nodeId);
                    }
                    else {
                        service = 'Block download response';
                        summary = 'Node ' + nodeId + ' replied to a block download control frame for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block download control response, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                    }
                }
                else {
                    service = 'Block download response';
                    summary = 'Node ' + nodeId + ' replied to an SDO block download control frame.';
                    detail = 'Command 0x' + toHex(command, 2) + ': block download control response.';
                }
            }
            else if (spec === 6) {
                if (session && session.mode === 'block' && session.transferDirection === 'upload') {
                    objectKey = resolveObjectKey(session, index, subIndex);
                    emittedIndex = resolveIndex(session, index);
                    emittedSubIndex = resolveSubIndex(session, subIndex);
                    if (session.phase === 'await-init-response') {
                        service = 'Block upload response';
                        summary = 'Node ' + nodeId + ' accepted block upload for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block upload response, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                        session.phase = 'await-start';
                    }
                    else if (session.phase === 'await-end') {
                        service = 'Block upload end';
                        summary = 'Node ' + nodeId + ' finished block upload for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block upload end frame, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                        session.phase = 'await-end-response';
                    }
                    else {
                        service = 'Block upload response';
                        summary = 'Node ' + nodeId + ' replied to a block upload control frame for ' + objectKey + '.';
                        detail = 'Command 0x' + toHex(command, 2) + ': block upload control response, data=' + sliceHex(1, Math.max(0, dlc - 1)) + '.';
                    }
                }
                else {
                    service = 'Block upload response';
                    summary = 'Node ' + nodeId + ' replied to an SDO block upload control frame.';
                    detail = 'Command 0x' + toHex(command, 2) + ': block upload control response.';
                }
            }
            else {
                service = 'Reserved response';
                summary = 'Node ' + nodeId + ' sent a reserved SDO response.';
                detail = 'Command 0x' + toHex(command, 2) + ': unsupported response specifier=' + spec + '.';
            }
        }
 
        setResult(typeClass, 'SDO', label, nodeId, formatNodeText(nodeId, false), direction, service, 0, resolveIndex(getSdoSession(nodeId), emittedIndex), resolveSubIndex(getSdoSession(nodeId), emittedSubIndex), summary, detail);
    }
 
    if (canId === 0x000) {
        var nmtCommand = dlc >= 1 ? byteAt(0) : -1;
        var nmtNodeId = dlc >= 2 ? byteAt(1) : 0;
        var nmtServiceNames = {
            1: 'Start remote node',
            2: 'Stop remote node',
            128: 'Enter pre-operational',
            129: 'Reset node',
            130: 'Reset communication'
        };
        var nmtService = nmtServiceNames[nmtCommand] || ('NMT command 0x' + toHex(nmtCommand < 0 ? 0 : nmtCommand, 2));
        setResult(
            'NMT',
            'NMT',
            'NMT Command',
            nmtNodeId,
            formatNodeText(nmtNodeId, true),
            'Master->Nodes',
            nmtService,
            0,
            -1,
            -1,
            nmtService + ' for ' + (nmtNodeId === 0 ? 'all nodes' : 'node ' + nmtNodeId) + '.',
            'Master control command.'
        );
    }
    else if (canId === 0x080) {
        setResult(
            'SYNC',
            'SYNC',
            'SYNC',
            -1,
            'Bus',
            'Producer->Consumers',
            'Synchronization',
            0,
            -1,
            -1,
            'Synchronize synchronous PDO/event processing.',
            dlc >= 1 ? 'SYNC counter=' + byteAt(0) + '.' : 'SYNC without counter byte.'
        );
    }
    else if (canId === 0x100) {
        if (dlc >= 6) {
            var msAfterMidnight = leUint32(0);
            var daysSince1984 = leUint16(4);
            setResult(
                'TIME',
                'TIME',
                'TIME',
                -1,
                'Bus',
                'Producer->Consumers',
                'Time stamp',
                0,
                -1,
                -1,
                'Global CANopen time stamp.',
                'Time=' + formatTimeOfDay(msAfterMidnight) + ', day=' + daysSince1984 + ' (' + formatDateFromEpoch(daysSince1984, msAfterMidnight) + ').'
            );
        }
        else {
            setResult(
                'TIME',
                'TIME',
                'TIME',
                -1,
                'Bus',
                'Producer->Consumers',
                'Time stamp',
                0,
                -1,
                -1,
                'Incomplete CANopen time stamp frame.',
                'Expected 6 payload byte(s), got ' + dlc + '.'
            );
        }
    }
    else if (canId >= 0x081 && canId <= 0x0FF) {
        var emcyNodeId = canId - 0x080;
        var emcyCode = dlc >= 2 ? leUint16(0) : 0;
        var emcyRegister = dlc >= 3 ? byteAt(2) : 0;
        var emcyManufacturer = dlc > 3 ? sliceHex(3, d.length - 3) : '';
        setResult(
            'EMCY',
            'EMCY',
            'EMCY',
            emcyNodeId,
            formatNodeText(emcyNodeId, false),
            'Node->Consumers',
            'Emergency',
            0,
            -1,
            -1,
            'Emergency message from node ' + emcyNodeId + '.',
            dlc >= 3
                ? 'Error code=0x' + toHex(emcyCode, 4) + ', error register=0x' + toHex(emcyRegister, 2) + (emcyManufacturer ? ', manufacturer=' + emcyManufacturer + '.' : '.')
                : 'Incomplete emergency frame.'
        );
    }
    else if (canId >= 0x180 && canId <= 0x1FF) {
        var tpdo1Node = canId - 0x180;
        setResult('TPDO', 'PDO', 'Transmit PDO 1', tpdo1Node, formatNodeText(tpdo1Node, false), 'Node->Consumers', 'Process data', 1, -1, -1, 'Process data transmitted by node ' + tpdo1Node + '.', 'PDO 1 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x200 && canId <= 0x27F) {
        var rpdo1Node = canId - 0x200;
        setResult('RPDO', 'PDO', 'Receive PDO 1', rpdo1Node, formatNodeText(rpdo1Node, false), 'Network->Node', 'Process data', 1, -1, -1, 'Process data addressed to node ' + rpdo1Node + '.', 'PDO 1 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x280 && canId <= 0x2FF) {
        var tpdo2Node = canId - 0x280;
        setResult('TPDO', 'PDO', 'Transmit PDO 2', tpdo2Node, formatNodeText(tpdo2Node, false), 'Node->Consumers', 'Process data', 2, -1, -1, 'Process data transmitted by node ' + tpdo2Node + '.', 'PDO 2 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x300 && canId <= 0x37F) {
        var rpdo2Node = canId - 0x300;
        setResult('RPDO', 'PDO', 'Receive PDO 2', rpdo2Node, formatNodeText(rpdo2Node, false), 'Network->Node', 'Process data', 2, -1, -1, 'Process data addressed to node ' + rpdo2Node + '.', 'PDO 2 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x380 && canId <= 0x3FF) {
        var tpdo3Node = canId - 0x380;
        setResult('TPDO', 'PDO', 'Transmit PDO 3', tpdo3Node, formatNodeText(tpdo3Node, false), 'Node->Consumers', 'Process data', 3, -1, -1, 'Process data transmitted by node ' + tpdo3Node + '.', 'PDO 3 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x400 && canId <= 0x47F) {
        var rpdo3Node = canId - 0x400;
        setResult('RPDO', 'PDO', 'Receive PDO 3', rpdo3Node, formatNodeText(rpdo3Node, false), 'Network->Node', 'Process data', 3, -1, -1, 'Process data addressed to node ' + rpdo3Node + '.', 'PDO 3 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x480 && canId <= 0x4FF) {
        var tpdo4Node = canId - 0x480;
        setResult('TPDO', 'PDO', 'Transmit PDO 4', tpdo4Node, formatNodeText(tpdo4Node, false), 'Node->Consumers', 'Process data', 4, -1, -1, 'Process data transmitted by node ' + tpdo4Node + '.', 'PDO 4 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x500 && canId <= 0x57F) {
        var rpdo4Node = canId - 0x500;
        setResult('RPDO', 'PDO', 'Receive PDO 4', rpdo4Node, formatNodeText(rpdo4Node, false), 'Network->Node', 'Process data', 4, -1, -1, 'Process data addressed to node ' + rpdo4Node + '.', 'PDO 4 payload, ' + d.length + ' byte(s).');
    }
    else if (canId >= 0x580 && canId <= 0x5FF) {
        decodeSdo(canId - 0x580, true);
    }
    else if (canId >= 0x600 && canId <= 0x67F) {
        decodeSdo(canId - 0x600, false);
    }
    else if (canId >= 0x700 && canId <= 0x77F) {
        var hbNodeId = canId - 0x700;
        if (dlc >= 1) {
            var stateByte = byteAt(0);
            if (stateByte === 0x00 && dlc === 1) {
                setResult('BOOTUP', 'HEARTBEAT', 'Boot-up', hbNodeId, formatNodeText(hbNodeId, false), 'Node->Consumers', 'Boot-up', 0, -1, -1, 'Node ' + hbNodeId + ' announced boot-up.', 'Boot-up message (state byte 0x00).');
            }
            else {
                var heartbeatStates = {
                    4: 'Stopped',
                    5: 'Operational',
                    127: 'Pre-operational'
                };
                var toggleBit = (stateByte >> 7) & 0x01;
                var stateValue = stateByte & 0x7F;
                var stateName = heartbeatStates[stateValue] || ('State 0x' + toHex(stateValue, 2));
                setResult('HEARTBEAT', 'HEARTBEAT', 'Heartbeat', hbNodeId, formatNodeText(hbNodeId, false), 'Node->Consumers', 'Heartbeat', 0, -1, -1, 'Node ' + hbNodeId + ' is ' + stateName.toLowerCase() + '.', 'State=' + stateName + ' (0x' + toHex(stateValue, 2) + '), guard toggle=' + toggleBit + '.');
            }
        }
        else {
            setResult('HEARTBEAT', 'HEARTBEAT', 'Heartbeat', hbNodeId, formatNodeText(hbNodeId, false), 'Node->Consumers', 'Heartbeat', 0, -1, -1, 'Incomplete heartbeat frame from node ' + hbNodeId + '.', 'Expected at least 1 payload byte.');
        }
    }
 
    if (rtr) {
        result.summary = 'Remote transmission request for ' + result.label.toLowerCase() + '.';
    }
    result.detail = appendTransportFlags(result.detail);
 
    next(accumulator, result, next.next, throwException);
    return acc;
}`;

/* ──────────────────────────────────────────────────────
 * SDO Block Decoder Layer
 *
 * Receives the filtered output of the CANopen Decoder layer
 * (only block-transfer SDO frames and abort frames, pre-selected
 * by the channel edge condition).
 *
 * Accumulates all payload bytes across the segment stream and
 * emits ONE assembled output per complete block transfer.
 * If the accumulated buffer grows beyond props.maxBytes an
 * intermediate chunk (complete=0) is emitted first; the rest
 * follows when the transfer finishes.
 *
 * Input fields used:
 *   service   – 'Block upload/download request/segment/end/
 *               end response', 'Abort transfer'
 *   nodeId    – CANopen node ID
 *   index     – SDO object index  (-1 while unknown)
 *   subIndex  – SDO object sub-index (-1 while unknown)
 *   raw       – raw CAN payload Uint8Array (8 bytes for segments)
 *
 * Output fields:
 *   data      – Uint8Array, assembled payload trimmed of padding
 *   index     – SDO object index
 *   subIndex  – SDO object sub-index
 *   nodeId    – CANopen node ID
 *   direction – 'upload' | 'download'
 *   complete  – 1 = final/only chunk, 0 = intermediate (maxBytes)
 *
 * Props:
 *   maxBytes  – flush threshold (default 65536)
 * ────────────────────────────────────────────────────── */
const sdoBlockDecoderLayer = `function middleware(ctx, accumulator, input, next, throwException, props) {
    /* ── Configuration ──────────────────────────────────── */
    var maxBytes = props && typeof props.maxBytes === 'number' && props.maxBytes > 0 ? props.maxBytes : 65536;

    /* ── Accumulator initialisation ─────────────────────── */
    var acc = accumulator && accumulator.sessions ? accumulator : {sessions: {}};

    /* ── Extract fields from upstream CANopen decoder ───── */
    var service  = input && input.service                      ? String(input.service) : '';
    var nodeId   = input && typeof input.nodeId   === 'number' ? input.nodeId          : -1;
    var index    = input && typeof input.index    === 'number' ? input.index           : -1;
    var subIndex = input && typeof input.subIndex === 'number' ? input.subIndex        : -1;
    var raw      = input && input.raw instanceof Uint8Array    ? input.raw             : new Uint8Array(0);

    /* ── Session helpers ────────────────────────────────── */
    /* Session key encodes both node and transfer direction so
       a simultaneous upload and download on the same node do
       not collide. */
    var isUploadService = service.indexOf('Block upload') === 0;
    var sessionKey      = String(nodeId) + (isUploadService ? '_up' : '_dn');

    function getSession()   { return acc.sessions[sessionKey] || null; }
    function setSession(s)  { acc.sessions[sessionKey] = s; return s;  }
    function clearSession() { delete acc.sessions[sessionKey];          }

    /* ── Emit assembled data downstream ─────────────────── */
    function emitChunk(session, bytes, complete) {
        next(acc, {
            data:      new Uint8Array(bytes),
            index:     session.index,
            subIndex:  session.subIndex,
            nodeId:    session.nodeId,
            direction: session.isUpload ? 'upload' : 'download',
            complete:  complete ? 1 : 0
        }, next.next, throwException);
    }

    /* ── Flush buffer chunks that have exceeded maxBytes ── */
    function flushToMax(session) {
        while (session.buffer.length >= maxBytes) {
            var chunk = session.buffer.splice(0, maxBytes);
            emitChunk(session, chunk, 0);
        }
    }

    /* ── Main dispatch ───────────────────────────────────── */
    var session = getSession();

    if (service === 'Block upload request' || service === 'Block download request') {
        /* Initiate: create (or reset) session */
        setSession({
            nodeId:      nodeId,
            index:       index,
            subIndex:    subIndex,
            isUpload:    isUploadService,
            buffer:      [],
            unusedFinal: 0
        });
    }
    else if ((service === 'Block upload segment' || service === 'Block download segment') && session) {
        /* Data segment: byte[0] = sequence/command; bytes[1..7] = payload */
        var dataLen = raw.length > 1 ? Math.min(7, raw.length - 1) : 0;
        for (var i = 1; i <= dataLen; i++) { session.buffer.push(raw[i]); }
        /* Refresh index/subIndex when the upstream decoded them from its session */
        if (index    >= 0) session.index    = index;
        if (subIndex >= 0) session.subIndex = subIndex;
        flushToMax(session);
    }
    else if ((service === 'Block upload end' || service === 'Block download end') && session) {
        /* End frame: bits[4:2] of command byte = n = unused padding bytes
           in the last data segment. Stored for the final trim. */
        var cmdByte = raw.length > 0 ? raw[0] : 0;
        session.unusedFinal = (cmdByte >> 2) & 0x07;
        if (index    >= 0) session.index    = index;
        if (subIndex >= 0) session.subIndex = subIndex;
    }
    else if ((service === 'Block upload end response' || service === 'Block download end response') && session) {
        /* Transfer confirmed complete: trim trailing padding and emit */
        var trimLen = session.buffer.length - session.unusedFinal;
        if (trimLen < 0) trimLen = 0;
        emitChunk(session, session.buffer.slice(0, trimLen), 1);
        clearSession();
    }
    else if (service === 'Abort transfer') {
        /* Peer aborted: discard both upload and download sessions for this node */
        delete acc.sessions[String(nodeId) + '_up'];
        delete acc.sessions[String(nodeId) + '_dn'];
    }
    /* All other Block* frames (server/client ACKs, upload-start, data-block
       ACKs) are silently consumed — no output, no state change needed. */

    return acc;
}`;

/* ──────────────────────────────────────────────────────
 * HTML template used by the CANopen row component
 * ────────────────────────────────────────────────────── */
const canopenRowHtml =
    '<div class="co-row co-${typeClass}">' +
    '  <span class="co-time">${time}</span>' +
    '  <span class="co-badge">${label}</span>' +
    '  <span class="co-cobid">${cobId}</span>' +
    '  <span class="co-node">${nodeText}</span>' +
    '  <div class="co-body">' +
    '    <div class="co-summary">${summary}</div>' +
    '    <div class="co-meta">${meta}</div>' +
    '  </div>' +
    '  <span class="co-hex">${hexData}</span>' +
    '</div>';
 
/* ──────────────────────────────────────────────────────
 * CSS - color-coded per CANopen message family
 * ────────────────────────────────────────────────────── */
const canopenCss = `
.co-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 8px;
  font-family: 'Fira Mono', 'Consolas', monospace;
  font-size: 0.82em;
  line-height: 1.35;
  border-bottom: 1px solid #edf1f5;
}
.co-row:hover { background: #f7f9fb; }
.co-time   { color: #90a4ae; min-width: 88px; padding-top: 2px; }
.co-badge  { display: inline-block; min-width: 136px; padding: 2px 8px; border-radius: 4px; font-weight: 700;
             font-size: 0.76em; text-transform: none; text-align: center; color: #fff; flex: 0 0 136px; }
.co-cobid  { color: #455a64; min-width: 66px; font-weight: 700; padding-top: 2px; }
.co-node   { color: #607d8b; min-width: 84px; padding-top: 2px; }
.co-body   { flex: 1; min-width: 0; }
.co-summary { color: #1f2a33; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.co-meta    { color: #607d8b; font-size: 0.92em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.co-hex     { color: #90a4ae; min-width: 180px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-top: 2px; }
 
/* Type colors */
.co-NMT       .co-badge { background: #d32f2f; }
.co-SYNC      .co-badge { background: #6a1b9a; }
.co-TIME      .co-badge { background: #3949ab; }
.co-EMCY      .co-badge { background: #d84315; }
.co-TPDO      .co-badge { background: #1e88e5; }
.co-RPDO      .co-badge { background: #00897b; }
.co-SDO_REQ   .co-badge { background: #ef6c00; }
.co-SDO_RES   .co-badge { background: #fb8c00; }
.co-HEARTBEAT .co-badge { background: #43a047; }
.co-BOOTUP    .co-badge { background: #7cb342; }
.co-UNKNOWN   .co-badge { background: #78909c; }
`;
 
/* ──────────────────────────────────────────────────────
 * Code Render - builds the HTML row from layer output fields
 * ────────────────────────────────────────────────────── */
const canopenRenderCode = `
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
 
var typeClass = data.typeClass || 'UNKNOWN';
var label = data.label || 'Unknown';
var cobId = data.cobId || '---';
var nodeText = data.nodeText || 'Bus';
var summary = data.summary || '';
var direction = data.direction || '';
var service = data.service || '';
var detail = data.detail || '';
var hexData = data.hexData || '';
var time = data._origin && data._origin.time ? data._origin.time : '';
var metaParts = [];
if (direction) metaParts.push(direction);
if (service) metaParts.push(service);
if (detail) metaParts.push(detail);
var meta = metaParts.join(' | ');
 
return '<div class="co-row co-' + escapeHtml(typeClass) + '">' +
    '<span class="co-time">' + escapeHtml(time) + '</span>' +
    '<span class="co-badge">' + escapeHtml(label) + '</span>' +
    '<span class="co-cobid">' + escapeHtml(cobId) + '</span>' +
    '<span class="co-node">' + escapeHtml(nodeText) + '</span>' +
    '<div class="co-body">' +
      '<div class="co-summary">' + escapeHtml(summary) + '</div>' +
      '<div class="co-meta">' + escapeHtml(meta) + '</div>' +
    '</div>' +
    '<span class="co-hex">' + escapeHtml(hexData) + '</span>' +
  '</div>';
`;
 
/* ──────────────────────────────────────────────────────
 * CANopen Raw render - just hex dump per frame, for the Raw tab
 * ────────────────────────────────────────────────────── */
const canopenRawRenderCode = `
function toHex(value, width) {
    var out = (value >>> 0).toString(16).toUpperCase();
    while (out.length < width) out = '0' + out;
    return out;
}
 
var canMeta = data._origin && data._origin.can ? data._origin.can : null;
var canId = canMeta && typeof canMeta.id === 'number' ? canMeta.id : 0;
var cobId = '0x' + toHex(canId, canMeta && (canMeta.ext || canId > 0x7FF) ? 8 : 3);
var dlc = canMeta && typeof canMeta.dlc === 'number' ? canMeta.dlc : 0;
var d = data.data;
var hex = '';
if (d && d.length) {
    for (var i = 0; i < d.length; i++) {
        hex += ('0' + d[i].toString(16).toUpperCase()).slice(-2);
        if (i < d.length - 1) hex += ' ';
    }
}
var flags = [];
if (canMeta && canMeta.rtr) flags.push('RTR');
if (canMeta && canMeta.ext) flags.push('EXT');
if (canMeta && canMeta.fd) flags.push('FD');
var time = data._origin && data._origin.time ? data._origin.time : '';
 
return '<div style="font-family:monospace;font-size:0.82em;padding:2px 8px;border-bottom:1px solid #edf1f5">' +
  '<span style="color:#90a4ae;min-width:88px;display:inline-block">' + time + '</span> ' +
  '<span style="color:#455a64;font-weight:700;min-width:66px;display:inline-block">' + cobId + '</span> ' +
  '<span style="color:#607d8b;min-width:58px;display:inline-block">[' + dlc + (flags.length ? ' ' + flags.join(',') : '') + ']</span> ' +
  '<span style="color:#1f2a33">' + hex + '</span>' +
'</div>';
`;
 
export const canopenDecoder: ProfileProperty = {
    name: "CANopen Decoder",
    schemaVersion: SCHEMA_VERSION,
    interfaces: [
        {
            id: 1, name: "CAN", type: InterfaceType.InterfaceCAN, deleted: false,
            settings: {
                transport: {bind: false, value: "serial"},
                bitrate: {bind: false, value: 500000},
                busMode: {bind: false, value: "normal"},
                canFd: {bind: false, value: false},
                socketUrl: {bind: false, value: "ws://localhost:8080"},
                idWhitelist: {bind: false, value: ""},
                defaultCanId: {bind: false, value: "0x600"},
            }
        }
    ],
    channels: [
        {
            id: 1, name: "CAN Input", type: ChannelType.Input, deleted: false,
            config: {
                interfaceRefs: [],
                nodes: [
                    {id: "0", type: "input", data: {label: "CAN", layerRef: undefined, hidden: false, bindings: []}, position: {x: 250, y: 50}},
                    {id: "1", type: "default", data: {label: "CANopen Decoder", layerRef: localRef(1, "CANopen Decoder", ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 200}},
                    {id: "2", type: "default", data: {label: "SDO Block Decoder", layerRef: localRef(2, "SDO Block Decoder", ElementType.Layer), hidden: false, bindings: []}, position: {x: 250, y: 350}},
                ],
                edges: [
                    {id: "0-1", source: "0", target: "1", routeConditionType: CompareDataType.Query, routeConditionSettings: {query: ""}, label: ""},
                    {id: "1-2", source: "1", target: "2", routeConditionType: CompareDataType.Code, routeConditionSettings: {code: "data.family === 'SDO' && (data.service.indexOf('Block') === 0 || data.service === 'Abort transfer')"}, label: "Block SDO"}
                ]
            }
        }
    ],
    layers: [
        {
            id: 1, name: "CANopen Decoder", type: LayerType.Layer, disabled: false, deterministic: true,
            config: {
                code: canopenDecoderLayer,
                input: [{id: 0, name: "data", type: IOParameterType.Uint8Array}],
                output: [
                    {id: 0, name: "typeClass", type: IOParameterType.String},
                    {id: 1, name: "family", type: IOParameterType.String},
                    {id: 2, name: "label", type: IOParameterType.String},
                    {id: 3, name: "nodeId", type: IOParameterType.Number},
                    {id: 4, name: "nodeText", type: IOParameterType.String},
                    {id: 5, name: "cobId", type: IOParameterType.String},
                    {id: 6, name: "direction", type: IOParameterType.String},
                    {id: 7, name: "service", type: IOParameterType.String},
                    {id: 8, name: "pdoNumber", type: IOParameterType.Number},
                    {id: 9, name: "index", type: IOParameterType.Number},
                    {id: 10, name: "subIndex", type: IOParameterType.Number},
                    {id: 11, name: "summary", type: IOParameterType.String},
                    {id: 12, name: "detail", type: IOParameterType.String},
                    {id: 13, name: "hexData", type: IOParameterType.String},
                    {id: 14, name: "raw", type: IOParameterType.Uint8Array},
                ],
                properties: [],
                testCode: `function test(props) {
    function toHex(value, width) {
        var out = (value >>> 0).toString(16).toUpperCase();
        while (out.length < width) out = '0' + out;
        return out;
    }

    function makeFrame(canId, bytes, opts) {
        var options = opts || {};
        return {
            data: new Uint8Array(bytes),
            _origin: {
                can: {
                    id: canId,
                    hex_id: '0x' + toHex(canId, canId > 0x7FF ? 8 : 3),
                    dlc: options.dlc != null ? options.dlc : bytes.length,
                    rtr: !!options.rtr,
                    ext: !!options.ext,
                    fd: !!options.fd
                },
                time: options.time || '12:34:56.789'
            }
        };
    }

    return [
        {
            test: makeFrame(0x000, [0x01, 0x05]),
            expected: [{
                typeClass: 'NMT',
                family: 'NMT',
                label: 'NMT Command',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x000',
                direction: 'Master->Nodes',
                service: 'Start remote node',
                pdoNumber: 0,
                index: -1,
                subIndex: -1,
                summary: 'Start remote node for node 5.',
                detail: 'Master control command.',
                hexData: '01 05',
                raw: new Uint8Array([0x01, 0x05])
            }]
        },
        {
            test: makeFrame(0x080, [0x12]),
            expected: [{
                typeClass: 'SYNC',
                family: 'SYNC',
                label: 'SYNC',
                nodeId: -1,
                nodeText: 'Bus',
                cobId: '0x080',
                direction: 'Producer->Consumers',
                service: 'Synchronization',
                pdoNumber: 0,
                index: -1,
                subIndex: -1,
                summary: 'Synchronize synchronous PDO/event processing.',
                detail: 'SYNC counter=18.',
                hexData: '12',
                raw: new Uint8Array([0x12])
            }]
        },
        {
            test: makeFrame(0x100, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: [{
                typeClass: 'TIME',
                family: 'TIME',
                label: 'TIME',
                nodeId: -1,
                nodeText: 'Bus',
                cobId: '0x100',
                direction: 'Producer->Consumers',
                service: 'Time stamp',
                pdoNumber: 0,
                index: -1,
                subIndex: -1,
                summary: 'Global CANopen time stamp.',
                detail: 'Time=00:00:00.000, day=0 (1984-01-01).',
                hexData: '00 00 00 00 00 00',
                raw: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
            }]
        },
        {
            test: makeFrame(0x185, [0x11, 0x22]),
            expected: [{
                typeClass: 'TPDO',
                family: 'PDO',
                label: 'Transmit PDO 1',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x185',
                direction: 'Node->Consumers',
                service: 'Process data',
                pdoNumber: 1,
                index: -1,
                subIndex: -1,
                summary: 'Process data transmitted by node 5.',
                detail: 'PDO 1 payload, 2 byte(s).',
                hexData: '11 22',
                raw: new Uint8Array([0x11, 0x22])
            }]
        },
        {
            test: makeFrame(0x605, [0x23, 0x00, 0x20, 0x01, 0x11, 0x22, 0x33, 0x44]),
            expected: [{
                typeClass: 'SDO_REQ',
                family: 'SDO',
                label: 'SDO Request',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x605',
                direction: 'Client->Server',
                service: 'Initiate download request',
                pdoNumber: 0,
                index: 8192,
                subIndex: 1,
                summary: 'Client writes 4 byte(s) to 0x2000:01 on node 5.',
                detail: 'Command 0x23: initiate download request, expedited=yes, size=yes, unused=0, data=11 22 33 44.',
                hexData: '23 00 20 01 11 22 33 44',
                raw: new Uint8Array([0x23, 0x00, 0x20, 0x01, 0x11, 0x22, 0x33, 0x44])
            }]
        },
        {
            test: makeFrame(0x605, [0xA4, 0x02, 0x21, 0x03, 0x7F, 0x00, 0x00, 0x00]),
            expected: [{
                typeClass: 'SDO_REQ',
                family: 'SDO',
                label: 'SDO Request',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x605',
                direction: 'Client->Server',
                service: 'Block upload request',
                pdoNumber: 0,
                index: 8450,
                subIndex: 3,
                summary: 'Client requested block upload of 0x2102:03 from node 5.',
                detail: 'Command 0xA4: initiate block upload request, trailer=7F 00 00 00.',
                hexData: 'A4 02 21 03 7F 00 00 00',
                raw: new Uint8Array([0xA4, 0x02, 0x21, 0x03, 0x7F, 0x00, 0x00, 0x00])
            }]
        },
        {
            test: makeFrame(0x605, [0xC6, 0x00, 0x20, 0x01, 0x08, 0x00, 0x00, 0x00]),
            expected: [{
                typeClass: 'SDO_REQ',
                family: 'SDO',
                label: 'SDO Request',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x605',
                direction: 'Client->Server',
                service: 'Block download request',
                pdoNumber: 0,
                index: 8192,
                subIndex: 1,
                summary: 'Client requested block download to 0x2000:01 on node 5.',
                detail: 'Command 0xC6: initiate block download request, trailer=08 00 00 00.',
                hexData: 'C6 00 20 01 08 00 00 00',
                raw: new Uint8Array([0xC6, 0x00, 0x20, 0x01, 0x08, 0x00, 0x00, 0x00])
            }]
        },
        {
            test: makeFrame(0x585, [0x0B, 0xAA, 0xBB, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: [{
                typeClass: 'SDO_RES',
                family: 'SDO',
                label: 'SDO Response',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x585',
                direction: 'Server->Client',
                service: 'Upload segment response',
                pdoNumber: 0,
                index: -1,
                subIndex: -1,
                summary: 'Final upload segment from node 5 with 2 data byte(s).',
                detail: 'Command 0x0B: toggle=0, last=yes, unused=5, data=AA BB.',
                hexData: '0B AA BB 00 00 00 00 00',
                raw: new Uint8Array([0x0B, 0xAA, 0xBB, 0x00, 0x00, 0x00, 0x00, 0x00])
            }]
        },
        {
            test: makeFrame(0x707, [0x05]),
            expected: [{
                typeClass: 'HEARTBEAT',
                family: 'HEARTBEAT',
                label: 'Heartbeat',
                nodeId: 7,
                nodeText: 'Node 7',
                cobId: '0x707',
                direction: 'Node->Consumers',
                service: 'Heartbeat',
                pdoNumber: 0,
                index: -1,
                subIndex: -1,
                summary: 'Node 7 is operational.',
                detail: 'State=Operational (0x05), guard toggle=0.',
                hexData: '05',
                raw: new Uint8Array([0x05])
            }]
        },
        {
            test: makeFrame(0x585, [0x80, 0x00, 0x20, 0x01, 0x00, 0x00, 0x01, 0x06]),
            expected: [{
                typeClass: 'SDO_RES',
                family: 'SDO',
                label: 'SDO Response',
                nodeId: 5,
                nodeText: 'Node 5',
                cobId: '0x585',
                direction: 'Server->Client',
                service: 'Abort transfer',
                pdoNumber: 0,
                index: 8192,
                subIndex: 1,
                summary: 'Node 5 aborted the SDO transfer for 0x2000:01.',
                detail: 'Command 0x80: abort transfer, code=0x06010000 Unsupported access to an object.',
                hexData: '80 00 20 01 00 00 01 06',
                raw: new Uint8Array([0x80, 0x00, 0x20, 0x01, 0x00, 0x00, 0x01, 0x06])
            }]
        }
    ];
}`
            }
        },
        {
            id: 2, name: "SDO Block Decoder", type: LayerType.Layer, disabled: false, deterministic: false,
            config: {
                code: sdoBlockDecoderLayer,
                input: [
                    {id: 0, name: "service",   type: IOParameterType.String},
                    {id: 1, name: "nodeId",    type: IOParameterType.Number},
                    {id: 2, name: "index",     type: IOParameterType.Number},
                    {id: 3, name: "subIndex",  type: IOParameterType.Number},
                    {id: 4, name: "direction", type: IOParameterType.String},
                    {id: 5, name: "raw",       type: IOParameterType.Uint8Array},
                ],
                output: [
                    {id: 0, name: "data",      type: IOParameterType.Uint8Array},
                    {id: 1, name: "index",     type: IOParameterType.Number},
                    {id: 2, name: "subIndex",  type: IOParameterType.Number},
                    {id: 3, name: "nodeId",    type: IOParameterType.Number},
                    {id: 4, name: "direction", type: IOParameterType.String},
                    {id: 5, name: "complete",  type: IOParameterType.Number},
                ],
                properties: [
                    {id: 1, name: "maxBytes", safeHtml: false, type: CustomPropertyType.Number, default: {bind: false, value: 65536}},
                ],
                testCode: `function test(props) {
    /* Block download of 15 bytes to node 5, object 0x2000:01.
       3 data segments × 7 bytes = 21 bytes collected; the end frame
       declares n=6 unused padding bytes in the last segment, so
       15 valid bytes are emitted on the end-response frame.
       Entries run sequentially sharing one accumulator; frames that
       produce no output have expected: []. */
    function makeInput(service, nodeId, index, subIndex, direction, rawBytes) {
        return {family: 'SDO', service: service, nodeId: nodeId, index: index,
                subIndex: subIndex, direction: direction, raw: new Uint8Array(rawBytes)};
    }
    return [
        {   // Initiate block download: creates session, no output
            test: makeInput('Block download request', 5, 0x2000, 1, 'Client->Server',
                [0xC6, 0x00, 0x20, 0x01, 0x0F, 0x00, 0x00, 0x00]),
            expected: []
        },
        {   // Server ACK to initiate: silently consumed, no output
            test: makeInput('Block download response', 5, 0x2000, 1, 'Server->Client',
                [0xA0, 0x7F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: []
        },
        {   // Segment 1 (seq=1): accumulates bytes 0x01..0x07
            test: makeInput('Block download segment', 5, 0x2000, 1, 'Client->Server',
                [0x01, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]),
            expected: []
        },
        {   // Segment 2 (seq=2): accumulates bytes 0x08..0x0E
            test: makeInput('Block download segment', 5, 0x2000, 1, 'Client->Server',
                [0x02, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E]),
            expected: []
        },
        {   // Segment 3 (seq=3, final flag): accumulates 0x0F + 6 padding zeros
            test: makeInput('Block download segment', 5, 0x2000, 1, 'Client->Server',
                [0x83, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: []
        },
        {   // Server data-block ACK: silently consumed, no output
            test: makeInput('Block download ACK', 5, 0x2000, 1, 'Server->Client',
                [0xA2, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: []
        },
        {   // Block download end: cmd=0xD9 -> n=(0xD9>>2)&7=6 unused bytes stored
            test: makeInput('Block download end', 5, 0x2000, 1, 'Client->Server',
                [0xD9, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: []
        },
        {   // Block download end response: trim 6, emit 15 valid bytes
            test: makeInput('Block download end response', 5, 0x2000, 1, 'Server->Client',
                [0xA1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
            expected: [{
                data:      new Uint8Array([0x01,0x02,0x03,0x04,0x05,0x06,0x07,
                                           0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F]),
                index:     0x2000,
                subIndex:  1,
                nodeId:    5,
                direction: 'download',
                complete:  1
            }]
        }
    ];
}`
            }
        }
    ],
    htmls: [
        {
            id: 1, name: "CANopen Row", deleted: false,
            type: HtmlComponentDefinitionFramework.SimpleTemplateLiteral,
            config: {
                code: canopenRowHtml,
                properties: [
                    {id: 1, name: "typeClass", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "UNKNOWN"}},
                    {id: 2, name: "time", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 3, name: "label", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "Unknown"}},
                    {id: 4, name: "cobId", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "0x000"}},
                    {id: 5, name: "nodeText", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: "Bus"}},
                    {id: 6, name: "summary", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 7, name: "meta", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                    {id: 8, name: "hexData", safeHtml: true, type: CustomPropertyType.Text, default: {bind: false, value: ""}},
                ]
            }
        }
    ],
    conditionalRenderings: [
        {
            id: 1, name: "Overview",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        {
            id: 2, name: "Control Traffic",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.family === 'NMT' || data.family === 'SYNC' || data.family === 'TIME';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        {
            id: 3, name: "SDO Traffic",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.family === 'SDO';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        {
            id: 4, name: "PDO Traffic",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.family === 'PDO';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        {
            id: 5, name: "Heartbeat Traffic",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.family === 'HEARTBEAT';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        {
            id: 6, name: "EMCY Traffic",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 1,
            compareDataType: CompareDataType.Code,
            compareDataSettings: {code: "return data.family === 'EMCY';"},
            stopPropagation: false,
            htmlRef: localRef(1, "CANopen Row", ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRenderCode}
        },
        {
            id: 7, name: "Raw CAN",
            channelRef: localRef(1, "CAN Input", ElementType.Channel), layerId: 0,
            compareDataType: CompareDataType.Query,
            compareDataSettings: {query: ""},
            stopPropagation: false,
            htmlRef: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html),
            renderModeType: RenderModeType.Code,
            renderModeSettings: {code: canopenRawRenderCode}
        },
    ],
    views: [
        {
            id: 1, name: "Overview", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "CANopen", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(1, "Overview", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 2, name: "SDO", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "SDO Transfers", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(3, "SDO Traffic", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 3, name: "PDO", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Process Data", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(4, "PDO Traffic", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 4, name: "Control", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "NMT/SYNC/TIME", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(2, "Control Traffic", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 5, name: "Heartbeat", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Error Control", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(5, "Heartbeat Traffic", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 6, name: "EMCY", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Emergency", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(6, "EMCY Traffic", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
        {
            id: 7, name: "Raw CAN", type: ViewType.TabView, layout: LayoutType.Full, deleted: false,
            config: {
                fragment1: {name: "Raw", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: [localRef(7, "Raw CAN", ElementType.ConditionalRendering)]}},
                fragment2: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
                fragment3: {name: "Fragment", type: ViewFragmentType.Append, percent: 100, config: {container: embeddedRef(HtmlEmbeddedComponentNames.Div, ElementType.Html), conditionalRenders: []}},
            }
        },
    ],
    events: [],
    actions: [],
    scripts: [],
    scriptsExportedSymbols: [],
    styles: [
        ...defaultStyles,
        {id: 3, name: "canopen.css", code: canopenCss},
    ],
    dependencies: [],
    settings: {isLibrary: false, rdnId: "", version: "1.1.0", maximumItemsPerView: 10000}
};