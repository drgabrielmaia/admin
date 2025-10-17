import { supabase } from './supabase'

export async function forceUpdateLeadsMetas(userId: string) {
  try {
    console.log('🔄 Forçando atualização de metas de leads...')
    
    // 1. Contar total de leads do usuário (APENAS leads aprovados ou novos - não convertidos pendentes)
    const { count: totalLeadsUser } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('sdr_id', userId)
      .in('status', ['novo', 'aprovado', 'qualificado'])
    
    console.log('📊 Total de leads do usuário:', totalLeadsUser)
    
    // 2. Contar total de leads de todos os SDRs (para meta de equipe) - APENAS aprovados
    const { count: totalLeadsEquipe } = await supabase
      .from('leads')
      .select('*, users!leads_sdr_id_fkey!inner(funcao)', { count: 'exact', head: true })
      .eq('users.funcao', 'sdr')
      .in('status', ['novo', 'aprovado', 'qualificado'])
      
    console.log('👥 Total de leads da equipe SDR:', totalLeadsEquipe)
    
    // 3. Atualizar metas individuais do usuário
    const { data: metasIndividuais, error: errorIndividuais } = await supabase
      .from('metas')
      .update({ 
        valor_atual: totalLeadsUser || 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('categoria', 'leads')
      .eq('status', 'ativa')
      .select()
    
    if (errorIndividuais) {
      console.error('❌ Erro ao atualizar metas individuais:', errorIndividuais)
    } else {
      console.log('✅ Metas individuais atualizadas:', metasIndividuais)
    }
    
    // 4. Atualizar metas de equipe SDR
    const { data: metasEquipe, error: errorEquipe } = await supabase
      .from('metas')
      .update({ 
        valor_atual: totalLeadsEquipe || 0,
        updated_at: new Date().toISOString()
      })
      .eq('tipo', 'equipe')
      .eq('funcao', 'sdr')
      .eq('categoria', 'leads')
      .eq('status', 'ativa')
      .select()
    
    if (errorEquipe) {
      console.error('❌ Erro ao atualizar metas de equipe:', errorEquipe)
    } else {
      console.log('✅ Metas de equipe atualizadas:', metasEquipe)
    }
    
    return {
      individualUpdated: metasIndividuais?.length || 0,
      teamUpdated: metasEquipe?.length || 0,
      totalLeadsUser: totalLeadsUser || 0,
      totalLeadsTeam: totalLeadsEquipe || 0
    }
    
  } catch (error) {
    console.error('❌ Erro geral ao atualizar metas:', error)
    throw error
  }
}

export async function forceUpdateAllMetas() {
  try {
    console.log('🔄 Atualizando todas as metas...')
    
    // Executar função RPC se existir
    await supabase.rpc('atualizar_metas_com_dados_reais').catch(e => 
      console.log('Função RPC não encontrada:', e.message)
    )
    
    // Refresh manual baseado em contagens reais
    const { data: allMetas } = await supabase
      .from('metas')
      .select('*')
      .eq('status', 'ativa')
    
    if (allMetas) {
      for (const meta of allMetas) {
        let valorAtual = 0
        
        if (meta.categoria === 'leads') {
          if (meta.tipo === 'individual') {
            const { count } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('sdr_id', meta.user_id)
              .in('status', ['novo', 'aprovado', 'qualificado'])
            valorAtual = count || 0
          } else if (meta.tipo === 'equipe' && meta.funcao === 'sdr') {
            const { count } = await supabase
              .from('leads')
              .select('*, users!leads_sdr_id_fkey!inner(funcao)', { count: 'exact', head: true })
              .eq('users.funcao', 'sdr')
              .in('status', ['novo', 'aprovado', 'qualificado'])
            valorAtual = count || 0
          }
        }
        
        // Atualizar meta com valor real
        await supabase
          .from('metas')
          .update({ 
            valor_atual: valorAtual,
            updated_at: new Date().toISOString()
          })
          .eq('id', meta.id)
        
        console.log(`✅ Meta ${meta.id} atualizada: ${valorAtual}`)
      }
    }
    
    console.log('✅ Todas as metas foram atualizadas')
    
  } catch (error) {
    console.error('❌ Erro ao atualizar todas as metas:', error)
    throw error
  }
}