   import React from 'react';
    import { View, Text, StyleSheet } from 'react-native';
    import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Main() {

    const insets = useSafeAreaInsets()
    
  return (
    <View style={{ paddingTop:insets.top , paddingBottom:insets.bottom}}>

      <View style={{ backgroundColor: '#F5EEDC', flex: 1, flexDirection: 'row', gap: 5,  }}>
        <View style={{backgroundColor: '#D56976', justifyContent: 'center', alignItems:'flex-start', width: 60, height: 60, borderRadius: 100}}/>

          <Text style={{ color: '#1E1E1E', fontSize: 50, fontWeight: 600  }}>Nupy</Text>

      
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  
});
