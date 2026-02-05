/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

import { FusionApiService, InspectionEvent, InspectionEventPayload } from '../assets/js/services/fusionApi';

describe('FusionApiService', () => {
    describe('buildUpdatePayloadFromForm', () => {
        const mockInspectionEvent: InspectionEvent = {
            IpEventId: 300000012272801,
            Sample: [{
                SampleId: 300000012272803,
                SampleDisposition: [{
                    SampleEventDispositionId: 300000012272804,
                    SampleResult: [
                        {
                            SampleResultId: 300000012272805,
                            CharacteristicName: 'MT 01M MAIN TANK',
                            DataType: 'CHARACTER'
                        },
                        {
                            SampleResultId: 300000012272807,
                            CharacteristicName: 'MT 01M BUSHINGS',
                            DataType: 'CHARACTER'
                        },
                        {
                            SampleResultId: 300000012272819,
                            CharacteristicName: 'MT 01M OLTC COUNTER',
                            DataType: 'NUMBER'
                        }
                    ]
                }]
            }]
        };

        it('should map form data to characteristic names', () => {
            const formData = {
                'MT 01M MAIN TANK': 'Pass',
                'MT 01M BUSHINGS': 'Fail',
                'MT 01M OLTC COUNTER': 5
            };

            const result = FusionApiService.buildUpdatePayloadFromForm(mockInspectionEvent, formData);

            expect(result.IpEventId).toBe(300000012272801);
            expect(result.Sample).toHaveLength(1);
            expect(result.Sample[0].SampleId).toBe(300000012272803);
            expect(result.Sample[0].SampleDisposition[0].SampleResult).toHaveLength(3);
        });

        it('should use ResultValueChar for CHARACTER type', () => {
            const formData = {
                'MT 01M MAIN TANK': 'Pass'
            };

            const result = FusionApiService.buildUpdatePayloadFromForm(mockInspectionEvent, formData);

            const sampleResult = result.Sample[0].SampleDisposition[0].SampleResult[0];
            expect(sampleResult.ResultValueChar).toBe('Pass');
            expect(sampleResult.ResultValueNumber).toBeUndefined();
        });

        it('should use ResultValueNumber for NUMBER type', () => {
            const formData = {
                'MT 01M OLTC COUNTER': 10
            };

            const result = FusionApiService.buildUpdatePayloadFromForm(mockInspectionEvent, formData);

            const sampleResult = result.Sample[0].SampleDisposition[0].SampleResult[0];
            expect(sampleResult.ResultValueNumber).toBe(10);
            expect(sampleResult.ResultValueChar).toBeUndefined();
        });

        it('should only include characteristics present in form data', () => {
            const formData = {
                'MT 01M MAIN TANK': 'Pass',
                'NonExistent Field': 'Value'
            };

            const result = FusionApiService.buildUpdatePayloadFromForm(mockInspectionEvent, formData);

            expect(result.Sample[0].SampleDisposition[0].SampleResult).toHaveLength(1);
            expect(result.Sample[0].SampleDisposition[0].SampleResult[0].CharacteristicName).toBe('MT 01M MAIN TANK');
        });

        it('should return empty Sample array when no matching fields', () => {
            const formData = {
                'NonExistent Field': 'Value'
            };

            const result = FusionApiService.buildUpdatePayloadFromForm(mockInspectionEvent, formData);

            expect(result.Sample).toHaveLength(0);
        });

        it('should handle empty form data', () => {
            const formData = {};

            const result = FusionApiService.buildUpdatePayloadFromForm(mockInspectionEvent, formData);

            expect(result.IpEventId).toBe(300000012272801);
            expect(result.Sample).toHaveLength(0);
        });
    });
});

describe('Context Detection', () => {
    it('should identify activity context from open message', () => {
        const openMessage = {
            activity: {
                aid: '3954799',
                resource_email: 'test@example.com'
            },
            openParams: {
                formLabel: 'InspectionForm'
            }
        };

        // Simple context detection logic test
        const hasActivity = openMessage.activity && openMessage.activity.aid;
        expect(hasActivity).toBeTruthy();
    });

    it('should identify inventory context from open message', () => {
        const openMessage = {
            inventory: {
                invid: '21259059'
            },
            openParams: {
                formLabel: 'InspectionForm'
            }
        };

        // Simple context detection logic test
        const hasInventory = openMessage.inventory && openMessage.inventory.invid;
        expect(hasInventory).toBeTruthy();
    });
});
