import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FeedbackTab = ({ colors }: { colors?: any }) => (
	<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors?.background || '#fff' }}>
		<Icon name="message-text-outline" size={48} color={colors?.primary || '#10b981'} style={{ marginBottom: 16 }} />
		<Text style={{ fontSize: 20, color: colors?.primary || '#10b981', fontWeight: 'bold' }}>Feedback</Text>
		<Text style={{ fontSize: 16, color: colors?.textSecondary || '#666', marginTop: 8 }}>Share your thoughts with us!</Text>
	</View>
);
export default FeedbackTab;
